import { NextRequest, NextResponse } from "next/server";
import { requireTableSession, setTableSessionCookie } from "@/lib/api-auth";
import { isValidPhone, normalisePhone, PHONE_HELP } from "@/lib/phone";
import { clientIp, pruneRateLimits, rateLimit } from "@/lib/rate-limit";
import { listOrdersForVisits } from "@/lib/store/orders";
import { findCurrentVisitAtTable, touchVisit } from "@/lib/store/visits";

export const dynamic = "force-dynamic";

/**
 * "Find my order" — for a student whose browser forgot them.
 *
 * Three things have to line up, and the combination is the whole security
 * story:
 *
 *  1. A valid table session, which means they physically scanned that table's
 *     printed code just now.
 *  2. The phone number they checked out with.
 *  3. One of their order tokens, e.g. LP-042.
 *
 * The lookup is scoped to *that table* and to *current* sittings only. There is
 * deliberately no way to search by phone number alone — that would turn a
 * guessable ten-digit number into a way to read strangers' orders from
 * anywhere. Attempts are throttled per session and per IP so the token cannot
 * be brute-forced either.
 */
const RECOVER_LIMIT = Number(process.env.RECOVER_RATE_LIMIT_PER_SESSION ?? 6);
const RECOVER_IP_LIMIT = Number(process.env.RECOVER_RATE_LIMIT_PER_IP ?? 60);
const WINDOW_MS = 60_000;

/** Students read "LP-042" off a screen; accept it typed any reasonable way. */
function normaliseToken(raw: unknown): string {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export async function POST(request: NextRequest) {
  const scope = await requireTableSession();
  if (!scope.ok) return scope.response;
  const { session } = scope;

  pruneRateLimits();
  const perSession = rateLimit(`recover:table:${session.tableId}`, RECOVER_LIMIT, WINDOW_MS);
  const perIp = rateLimit(`recover:ip:${clientIp(request.headers)}`, RECOVER_IP_LIMIT, WINDOW_MS);
  if (!perSession.allowed || !perIp.allowed) {
    const retry = Math.max(perSession.retryAfterSeconds, perIp.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many attempts. Wait a moment and try again.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }

  let body: { phone?: string; tokenNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const phone = normalisePhone(body.phone);
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: PHONE_HELP, code: "phone_invalid" }, { status: 400 });
  }

  const wantedToken = normaliseToken(body.tokenNumber);
  if (!wantedToken) {
    return NextResponse.json(
      { error: "Enter the token number from your order, like LP-042.", code: "token_required" },
      { status: 400 },
    );
  }

  const visit = await findCurrentVisitAtTable(session.tableId, phone);
  const matched =
    visit &&
    (await listOrdersForVisits([visit.id])).some((o) => normaliseToken(o.tokenNumber) === wantedToken);

  // One message for every kind of miss, so this cannot be used to learn which
  // half was right — that is what would make the number worth guessing.
  if (!visit || !matched) {
    return NextResponse.json(
      {
        error: "No order at this table matches that number and token. Check both, or ask at the counter.",
        code: "no_match",
      },
      { status: 404 },
    );
  }

  await touchVisit(visit.id);
  await setTableSessionCookie({ ...session, visitId: visit.id });

  return NextResponse.json({ recovered: true });
}
