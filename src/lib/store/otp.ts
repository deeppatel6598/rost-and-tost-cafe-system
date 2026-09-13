import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { generateId, maskPhone } from "@/lib/format";
import { sql } from "@/lib/db/sql";
import { authSecret } from "@/lib/secret";
import { otpChannel } from "@/lib/otp";

/* ── Shape of the thing ──────────────────────────────────────────────────── */

export type ChallengePurpose = "verify_device" | "recover_session";

export interface Challenge {
  id: string;
  phone: string;
  codeHash: string;
  purpose: ChallengePurpose;
  deviceHash: string;
  tableId: string | null;
  attempts: number;
  sends: number;
  lastSentAt: string;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
}

/** Five minutes is long enough for a slow carrier, short enough to be useless later. */
const TTL_MS = 5 * 60 * 1000;
/** A verified phone is remembered for a term, not a meal. */
export const VERIFIED_TTL_DAYS = 90;
/** Five wrong guesses burns the challenge: 10^6 / 5 makes online brute force hopeless. */
const MAX_ATTEMPTS = 5;
/** Resends per challenge, and the wait between them. Both are spend controls. */
const MAX_SENDS = 3;
const RESEND_COOLDOWN_MS = 30_000;
/** Per number per hour, and for the whole canteen per day. */
const SENDS_PER_PHONE_PER_HOUR = Number(process.env.OTP_SENDS_PER_PHONE_PER_HOUR ?? 5);
const SENDS_PER_DAY = Number(process.env.OTP_SENDS_PER_DAY ?? 500);

export type IssueResult =
  | { ok: true; challengeId: string; resent: boolean; cooldownSeconds: number }
  | { ok: false; code: "cooldown" | "too_many" | "send_failed" | "channel_down"; message: string; retryAfterSeconds?: number };

export type VerifyResult =
  | { ok: true; challenge: Challenge }
  | { ok: false; code: "no_match" | "too_many"; message: string };

/* ── The code itself ─────────────────────────────────────────────────────── */

/**
 * Six digits, uniformly drawn, leading zeros allowed.
 *
 * randomInt is the CSPRNG — Math.random would make the code guessable from
 * a couple of observed values, which is precisely the thing being defended.
 */
function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * HMAC-SHA256 keyed by AUTH_SECRET, not scrypt.
 *
 * A six-digit code has a million-value space, so any unkeyed hash would be
 * exhaustible from a database dump in milliseconds. The server-side key is
 * what makes a leaked row worthless; the attempt cap is what stops the same
 * search happening online. scrypt would add latency to every single verify and
 * buy nothing that the key does not already buy.
 */
function hashCode(code: string, phone: string): string {
  return createHmac("sha256", authSecret()).update(`otp:${phone}:${code}`).digest("hex");
}

function codeMatches(candidate: string, phone: string, storedHash: string): boolean {
  const a = Buffer.from(hashCode(candidate, phone), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/* ── Spend limits, counted in Postgres ───────────────────────────────────── */

async function spendAllowed(phone: string): Promise<{ allowed: boolean; reason?: string }> {
  const [perPhone] = await sql<{ n: number }[]>`
    select count(*)::int as n from otp_sends
    where phone = ${phone} and sent_at > now() - interval '1 hour'
  `;
  if (perPhone.n >= SENDS_PER_PHONE_PER_HOUR) {
    return { allowed: false, reason: "phone_hourly" };
  }

  const [perDay] = await sql<{ n: number }[]>`
    select count(*)::int as n from otp_sends where sent_at > now() - interval '1 day'
  `;
  if (perDay.n >= SENDS_PER_DAY) {
    // A ceiling on the whole canteen. Reaching it is not normal traffic, so it
    // is logged loudly rather than silently spending the SMS budget.
    console.error(`[otp] daily send ceiling of ${SENDS_PER_DAY} reached — refusing further sends`);
    return { allowed: false, reason: "daily" };
  }

  return { allowed: true };
}

async function recordSend(phone: string, ip: string | null, channel: string, ok: boolean): Promise<void> {
  await sql`
    insert into otp_sends (id, phone, ip, channel, ok)
    values (${generateId("send")}, ${phone}, ${ip}, ${channel}, ${ok})
  `;
}

/* ── Issue ───────────────────────────────────────────────────────────────── */

/** The live challenge for this device and number, if there is one. */
async function liveChallenge(
  phone: string,
  deviceHash: string,
  purpose: ChallengePurpose,
): Promise<Challenge | undefined> {
  const [row] = await sql<Challenge[]>`
    select * from phone_challenges
    where phone = ${phone} and device_hash = ${deviceHash} and purpose = ${purpose}
      and consumed_at is null and expires_at > now() and attempts < ${MAX_ATTEMPTS}
    order by created_at desc
    limit 1
  `;
  return row;
}

/**
 * Sends a code, or resends the live one.
 *
 * A resend reuses the same challenge row and the same code rather than minting
 * a new one. If it minted a new code, the first SMS — which often arrives
 * late rather than never — would silently stop working, and the student would
 * be typing a code that is on their screen and wrong.
 */
export async function issueChallenge(args: {
  phone: string;
  deviceHash: string;
  purpose: ChallengePurpose;
  tableId?: string | null;
  ip?: string | null;
}): Promise<IssueResult> {
  const channel = otpChannel();
  if (!channel.healthy()) {
    return {
      ok: false,
      code: "channel_down",
      message: "We can't send codes right now. Ask at the counter and staff can help.",
    };
  }

  const existing = await liveChallenge(args.phone, args.deviceHash, args.purpose);

  if (existing) {
    const since = Date.now() - new Date(existing.lastSentAt).getTime();
    if (since < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - since) / 1000);
      return {
        ok: false,
        code: "cooldown",
        message: `Wait ${wait} more second${wait === 1 ? "" : "s"} before asking for another code.`,
        retryAfterSeconds: wait,
      };
    }
    if (existing.sends >= MAX_SENDS) {
      return {
        ok: false,
        code: "too_many",
        message: "That's as many codes as we can send for now. Try again in a few minutes.",
      };
    }
  }

  const spend = await spendAllowed(args.phone);
  if (!spend.allowed) {
    return {
      ok: false,
      code: "too_many",
      message: "Too many codes requested. Try again later, or ask at the counter.",
    };
  }

  // Every send carries a new code, including a resend. We hold only the hash,
  // so the old plaintext is genuinely unrecoverable — there is no way to send
  // it twice. That is worth being explicit about because it drives the copy:
  // the screen must tell the student to use the newest message, or they will
  // type the first code they received and be told it is wrong.
  const code = newCode();
  const expiresAt = new Date(Date.now() + TTL_MS);
  const challengeId = existing?.id ?? generateId("chal");

  if (existing) {
    await sql`
      update phone_challenges
      set code_hash = ${hashCode(code, args.phone)},
          sends = sends + 1,
          attempts = 0,
          last_sent_at = now(),
          expires_at = ${expiresAt}
      where id = ${challengeId}
    `;
  } else {
    await sql`
      insert into phone_challenges (id, phone, code_hash, purpose, device_hash, table_id, expires_at)
      values (
        ${challengeId}, ${args.phone}, ${hashCode(code, args.phone)}, ${args.purpose},
        ${args.deviceHash}, ${args.tableId ?? null}, ${expiresAt}
      )
    `;
  }

  const sent = await channel.send(args.phone, code);
  await recordSend(args.phone, args.ip ?? null, channel.name, sent.ok);
  if (!sent.ok) {
    return {
      ok: false,
      code: "send_failed",
      message: "We couldn't send the code. Try again, or ask at the counter.",
    };
  }

  console.info(
    `[otp] ${existing ? "resent" : "issued"} ${args.purpose} for ${maskPhone(args.phone)} via ${channel.name}`,
  );
  return {
    ok: true,
    challengeId,
    resent: Boolean(existing),
    cooldownSeconds: RESEND_COOLDOWN_MS / 1000,
  };
}

/* ── Verify ──────────────────────────────────────────────────────────────── */

/**
 * Checks a code and, on success, consumes the challenge.
 *
 * The consume is a single conditional UPDATE, the same pattern the token
 * sequence uses: two simultaneous submissions of the same correct code cannot
 * both win, because only one of them gets a row back.
 *
 * Every failure returns the same message. Wrong code, expired code, wrong
 * number, no challenge at all — telling them apart is what would make a
 * ten-digit number worth guessing.
 */
export async function verifyChallenge(args: {
  phone: string;
  deviceHash: string;
  purpose: ChallengePurpose;
  code: string;
}): Promise<VerifyResult> {
  const NO_MATCH = {
    ok: false as const,
    code: "no_match" as const,
    message: "That code isn't right. Check it, or ask for a new one.",
  };

  const submitted = String(args.code ?? "").replace(/\D/g, "");
  if (submitted.length !== 6) return NO_MATCH;

  const challenge = await liveChallenge(args.phone, args.deviceHash, args.purpose);
  if (!challenge) return NO_MATCH;

  if (!codeMatches(submitted, args.phone, challenge.codeHash)) {
    const [row] = await sql<{ attempts: number }[]>`
      update phone_challenges set attempts = attempts + 1
      where id = ${challenge.id}
      returning attempts
    `;
    if (row && row.attempts >= MAX_ATTEMPTS) {
      return {
        ok: false,
        code: "too_many",
        message: "Too many wrong codes. Ask for a new one.",
      };
    }
    return NO_MATCH;
  }

  const [consumed] = await sql<Challenge[]>`
    update phone_challenges set consumed_at = now()
    where id = ${challenge.id} and consumed_at is null and expires_at > now()
    returning *
  `;
  if (!consumed) return NO_MATCH;

  if (consumed.purpose === "verify_device") {
    await sql`
      insert into verified_phones (phone, device_hash, expires_at)
      values (
        ${consumed.phone}, ${consumed.deviceHash},
        now() + ${`${VERIFIED_TTL_DAYS} days`}::interval
      )
      on conflict (phone, device_hash)
      do update set verified_at = now(), expires_at = excluded.expires_at
    `;
  }

  console.info(`[otp] verified ${consumed.purpose} for ${maskPhone(consumed.phone)}`);
  return { ok: true, challenge: consumed };
}

/* ── The question every gate asks ────────────────────────────────────────── */

/** Has this browser proved it holds this number, and recently enough? */
export async function isPhoneVerified(phone: string, deviceHash: string | undefined): Promise<boolean> {
  if (!deviceHash || !phone) return false;
  const rows = await sql`
    select 1 from verified_phones
    where phone = ${phone} and device_hash = ${deviceHash} and expires_at > now()
  `;
  return rows.length > 0;
}

/** Housekeeping: consumed and expired rows have no further use. */
export async function pruneChallenges(): Promise<void> {
  await sql`delete from phone_challenges where expires_at < now() - interval '1 day'`;
  await sql`delete from otp_sends where sent_at < now() - interval '30 days'`;
}
