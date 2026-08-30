import { createHmac, timingSafeEqual } from "crypto";

/**
 * Dining-table QR tokens.
 *
 * The QR sticker on a table encodes /t/<qr_token>, never /t/12 and never
 * ?table=12. A bare table number would let anyone order food to any table in
 * the canteen, and would let someone print a counterfeit sticker pointing at
 * a table that isn't theirs. The token is an HMAC of the table number keyed
 * by AUTH_SECRET, so only the server (which holds the secret) can mint a
 * valid one, and it is verified server-side on every entry.
 *
 * The token is deterministic for a given table so a sticker printed once
 * stays valid. Rotating AUTH_SECRET invalidates every printed QR code — that
 * is the intended lever if stickers are ever compromised.
 */

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
}

const TOKEN_LENGTH = 20;

export function signTableToken(tableNumber: number): string {
  return createHmac("sha256", getSecret())
    .update(`sk-canteen:table:${tableNumber}`)
    .digest("hex")
    .slice(0, TOKEN_LENGTH);
}

export function verifyTableToken(tableNumber: number, token: string | null | undefined): boolean {
  if (!token || token.length !== TOKEN_LENGTH) return false;
  const expected = signTableToken(tableNumber);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
