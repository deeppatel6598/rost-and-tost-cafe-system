import { createHmac, timingSafeEqual } from "crypto";

/**
 * Table QR links are signed so a guest can't just edit the number in the URL
 * bar and place an order under a table they're not sitting at. The token is
 * a truncated HMAC of the table number, keyed by AUTH_SECRET — deterministic
 * (so the same table always gets the same code, fine to print once) but
 * unguessable without the secret. Verified both when the ordering page
 * loads AND again server-side when the order is created, so bypassing the
 * UI and calling the API directly doesn't work either.
 */
function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
}

const TOKEN_LENGTH = 16;

export function signTableToken(tableNumber: number): string {
  return createHmac("sha256", getSecret())
    .update(`table:${tableNumber}`)
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
