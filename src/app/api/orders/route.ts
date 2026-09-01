import { NextRequest, NextResponse } from "next/server";
import { requireTableSession } from "@/lib/api-auth";
import { maskPhone } from "@/lib/format";
import { isValidPhone, normalisePhone, PHONE_HELP } from "@/lib/phone";
import { clientIp, pruneRateLimits, rateLimit } from "@/lib/rate-limit";
import { createOrder, OrderError } from "@/lib/store/orders";
import { buildUpiLink } from "@/lib/upi";
import { getStall } from "@/lib/store/stalls";
import type { CartLineInput, CreateOrderInput } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Placing an order costs the student nothing, so it needs a ceiling.
 *
 * The per-session limit is the meaningful one: it is scoped to a single table
 * and is what stops one person spamming tokens. The per-IP limit is a blunt
 * backstop and is deliberately generous, because campus wifi NATs the whole
 * canteen behind a handful of addresses — set it too low and the lunch rush
 * throttles itself. Both are env-tunable so the numbers can be adjusted
 * against real traffic without a redeploy of logic.
 */
const PER_SESSION_LIMIT = Number(process.env.ORDER_RATE_LIMIT_PER_SESSION ?? 8);
const PER_IP_LIMIT = Number(process.env.ORDER_RATE_LIMIT_PER_IP ?? 200);
const WINDOW_MS = 60_000;

function normaliseLines(raw: unknown): CartLineInput[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 40).map((line) => {
    const l = line as Partial<CartLineInput>;
    return {
      itemId: String(l.itemId ?? ""),
      variantId: l.variantId ? String(l.variantId) : undefined,
      addonIds: Array.isArray(l.addonIds) ? l.addonIds.slice(0, 10).map(String) : [],
      quantity: Number(l.quantity ?? 0),
    };
  });
}

export async function POST(request: NextRequest) {
  const scope = await requireTableSession();
  if (!scope.ok) return scope.response;
  const { session } = scope;

  pruneRateLimits();
  const ip = clientIp(request.headers);
  const perSession = rateLimit(`order:table:${session.tableId}`, PER_SESSION_LIMIT, WINDOW_MS);
  const perIp = rateLimit(`order:ip:${ip}`, PER_IP_LIMIT, WINDOW_MS);
  if (!perSession.allowed || !perIp.allowed) {
    const retry = Math.max(perSession.retryAfterSeconds, perIp.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many orders too quickly. Please wait a moment.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }

  // The idempotency key is generated once per checkout attempt on the client,
  // so a double-tap or an offline retry of a request that actually landed
  // replays the first order instead of creating a second one.
  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) {
    return NextResponse.json(
      { error: "Missing idempotency key.", code: "missing_idempotency_key" },
      { status: 400 },
    );
  }

  let body: CreateOrderInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.stallId || (body.paymentMethod !== "cash" && body.paymentMethod !== "upi")) {
    return NextResponse.json({ error: "Stall and payment method are required." }, { status: 400 });
  }

  // The phone number is required. Checked here as well as in the store so a
  // request that skips the checkout screen cannot skip the rule.
  const phone = normalisePhone(body.guestPhone);
  if (!phone) {
    return NextResponse.json(
      { error: "A phone number is required to place an order.", code: "phone_required" },
      { status: 400 },
    );
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: PHONE_HELP, code: "phone_invalid" }, { status: 400 });
  }

  try {
    const { subOrder, replayed } = createOrder({
      tableId: session.tableId,
      stallId: body.stallId,
      lines: normaliseLines(body.lines),
      paymentMethod: body.paymentMethod,
      specialInstructions: typeof body.specialInstructions === "string" ? body.specialInstructions : undefined,
      guestPhone: phone,
      idempotencyKey,
      expectedTotal: typeof body.expectedTotal === "number" ? body.expectedTotal : undefined,
    });

    // Phone numbers are masked here; the plaintext value never reaches a log line.
    console.info(
      `[order] ${replayed ? "replayed" : "created"} ${subOrder.tokenNumber} table=${subOrder.tableNumber} ` +
        `stall=${subOrder.stallId} total=${subOrder.total} phone=${maskPhone(subOrder.guestPhone)}`,
    );

    const stall = getStall(subOrder.stallId);
    const upiLink =
      subOrder.paymentMethod === "upi" && stall
        ? buildUpiLink(stall, subOrder.total, subOrder.tokenNumber)
        : null;

    return NextResponse.json(
      { subOrder, publicToken: subOrder.publicToken, upiLink, replayed },
      { status: replayed ? 200 : 201 },
    );
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    console.error("[order] unexpected failure", err);
    return NextResponse.json({ error: "Could not place the order." }, { status: 500 });
  }
}
