import { NextRequest, NextResponse } from "next/server";
import { requireTableSession } from "@/lib/api-auth";
import { readDeviceHash } from "@/lib/device";
import { isValidPhone, normalisePhone, PHONE_HELP } from "@/lib/phone";
import { clientIp, pruneRateLimits, rateLimit } from "@/lib/rate-limit";
import { verifyChallenge } from "@/lib/store/otp";

export const dynamic = "force-dynamic";

/**
 * Check a code.
 *
 * Costs nothing to call, so the limits here are about brute force rather than
 * spend — and they sit on top of the five-attempt cap that burns the challenge
 * itself. Between them, working through a million codes would take more
 * challenges than the send limits will ever allow.
 */
const CHECK_LIMIT = Number(process.env.VERIFY_CHECK_LIMIT_PER_SESSION ?? 12);
const CHECK_IP_LIMIT = Number(process.env.VERIFY_CHECK_LIMIT_PER_IP ?? 100);
const WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const scope = await requireTableSession();
  if (!scope.ok) return scope.response;
  const { session } = scope;

  pruneRateLimits();
  const perSession = rateLimit(`verifycheck:table:${session.tableId}`, CHECK_LIMIT, WINDOW_MS);
  const perIp = rateLimit(`verifycheck:ip:${clientIp(request.headers)}`, CHECK_IP_LIMIT, WINDOW_MS);
  if (!perSession.allowed || !perIp.allowed) {
    const retry = Math.max(perSession.retryAfterSeconds, perIp.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many attempts. Wait a moment and try again.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }

  let body: { phone?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const phone = normalisePhone(body.phone);
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: PHONE_HELP, code: "phone_invalid" }, { status: 400 });
  }

  // Deliberately does not mint a device cookie. A check without one cannot
  // match any challenge, and minting here would let someone collect a fresh
  // identity by guessing rather than by asking for a code.
  const deviceHash = readDeviceHash();
  const result = await verifyChallenge({ phone, deviceHash: deviceHash ?? "", code: String(body.code ?? ""), purpose: "verify_device" });

  if (!result.ok) {
    return NextResponse.json({ error: result.message, code: result.code }, { status: 400 });
  }

  return NextResponse.json({ verified: true });
}
