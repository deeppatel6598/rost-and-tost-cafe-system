import { NextRequest, NextResponse } from "next/server";
import { requireTableSession } from "@/lib/api-auth";
import { ensureDeviceHash } from "@/lib/device";
import { isValidPhone, normalisePhone, PHONE_HELP } from "@/lib/phone";
import { clientIp, pruneRateLimits, rateLimit } from "@/lib/rate-limit";
import { issueChallenge, type ChallengePurpose } from "@/lib/store/otp";

export const dynamic = "force-dynamic";

/**
 * Send a code to a number.
 *
 * Requires a table session, so a code can only be requested by someone who
 * physically scanned a printed QR sticker just now. That alone rules out
 * remote abuse of the send endpoint, which matters more here than on other
 * routes because **every call to this one costs money**.
 *
 * The per-request limiter below is only the first of three gates. The real
 * spend controls — per number per hour, per challenge, and a ceiling for the
 * whole canteen per day — are counted in Postgres inside issueChallenge,
 * because this limiter is per-process and would multiply by instance count.
 */
const START_LIMIT = Number(process.env.VERIFY_RATE_LIMIT_PER_SESSION ?? 5);
const START_IP_LIMIT = Number(process.env.VERIFY_RATE_LIMIT_PER_IP ?? 40);
const WINDOW_MS = 60_000;

const PURPOSES: ChallengePurpose[] = ["verify_device", "recover_session"];

export async function POST(request: NextRequest) {
  const scope = await requireTableSession();
  if (!scope.ok) return scope.response;
  const { session } = scope;

  pruneRateLimits();
  const perSession = rateLimit(`verify:table:${session.tableId}`, START_LIMIT, WINDOW_MS);
  const perIp = rateLimit(`verify:ip:${clientIp(request.headers)}`, START_IP_LIMIT, WINDOW_MS);
  if (!perSession.allowed || !perIp.allowed) {
    const retry = Math.max(perSession.retryAfterSeconds, perIp.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many attempts. Wait a moment and try again.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }

  let body: { phone?: string; purpose?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const phone = normalisePhone(body.phone);
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: PHONE_HELP, code: "phone_invalid" }, { status: 400 });
  }

  const purpose = PURPOSES.includes(body.purpose as ChallengePurpose)
    ? (body.purpose as ChallengePurpose)
    : "verify_device";

  const result = await issueChallenge({
    phone,
    deviceHash: ensureDeviceHash(),
    purpose,
    tableId: session.tableId,
    ip: clientIp(request.headers),
  });

  if (!result.ok) {
    // 429 for "slow down", 503 for "the channel is unusable" — the second is
    // the one the UI turns into "ask at the counter" rather than "try again".
    const status = result.code === "cooldown" || result.code === "too_many" ? 429 : 503;
    return NextResponse.json(
      { error: result.message, code: result.code },
      {
        status,
        headers: result.retryAfterSeconds
          ? { "Retry-After": String(result.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  // The challenge id is not returned. The phone plus this browser's device
  // cookie already identify the challenge, and handing out an id would be one
  // more value to guess for nothing gained.
  return NextResponse.json({
    sent: true,
    resent: result.resent,
    cooldownSeconds: result.cooldownSeconds,
  });
}
