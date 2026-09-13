import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";

/**
 * A long-lived handle on this browser.
 *
 * Separate from the seating cookie on purpose. The seating cookie is a meal —
 * four hours, re-minted every time a QR code is scanned. This one is a term,
 * and it is the reason a student verifies their number once and then never
 * sees a code again. Collapsing the two would mean re-verifying after every
 * lunch, which is the expensive design this was built to avoid.
 *
 * The raw value stays in the cookie and never reaches the database; only its
 * SHA-256 is stored, so a dump of verified_phones cannot be replayed as a
 * cookie. It is not a credential on its own — holding it proves nothing until
 * a code has been verified against it — so a plain hash is the right strength
 * here, and there is nothing to make expensive.
 */
export const DEVICE_COOKIE = "sk_device";

const DEVICE_TTL_SECONDS = 60 * 60 * 24 * 400;

const DEVICE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export function hashDevice(raw: string): string {
  return createHash("sha256").update(`device:${raw}`).digest("hex");
}

/** The device hash for this request, or undefined if the browser has no cookie yet. */
export function readDeviceHash(): string | undefined {
  const raw = cookies().get(DEVICE_COOKIE)?.value;
  return raw ? hashDevice(raw) : undefined;
}

/**
 * The device hash, minting the cookie if this browser has never had one.
 *
 * Called only on paths that are about to need an identity — starting a
 * verification — rather than on every page, so a student who only ever browses
 * a menu is never given a year-long cookie they had no use for.
 */
export function ensureDeviceHash(): string {
  const existing = cookies().get(DEVICE_COOKIE)?.value;
  if (existing) return hashDevice(existing);

  const raw = randomBytes(32).toString("base64url");
  cookies().set(DEVICE_COOKIE, raw, { ...DEVICE_COOKIE_OPTIONS, maxAge: DEVICE_TTL_SECONDS });
  return hashDevice(raw);
}
