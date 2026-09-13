/**
 * The one signing secret the app has.
 *
 * AUTH_SECRET keys two different things: the JWTs behind staff and table
 * sessions, and the HMAC inside every printed table QR code. A fallback value
 * that ships in the repository is therefore not a convenience — anyone who can
 * read this file could mint a staff session for any stall and a valid QR token
 * for any table. So the fallback exists in development only, and production
 * refuses to start without a real one.
 *
 * The build phase is exempt: `next build` imports route modules to collect
 * metadata, and a deploy pipeline has no reason to hold production secrets.
 */
const DEV_FALLBACK = "dev-only-insecure-secret-change-me";

function reason(secret: string | undefined): string | null {
  if (!secret) {
    return "AUTH_SECRET is not set. Generate one with `openssl rand -hex 32`. " +
      "It signs staff sessions and every table QR code, so changing it later reprints the stickers.";
  }
  // Rejected by name, not just by length: this string is long enough to pass a
  // length test and is printed in the README, so it is the most likely value to
  // be copied into a real deployment by mistake.
  if (secret === DEV_FALLBACK) {
    return "AUTH_SECRET is still the development placeholder, which is published in this repository. " +
      "Generate a real one with `openssl rand -hex 32`.";
  }
  if (secret.length < 32) {
    return "AUTH_SECRET is too short. Use at least 32 characters — `openssl rand -hex 32`.";
  }
  return null;
}

function resolve(): string {
  const secret = process.env.AUTH_SECRET;
  const problem = reason(secret);
  if (!problem) return secret as string;

  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  if (process.env.NODE_ENV === "production" && !isBuildPhase) throw new Error(problem);
  return secret || DEV_FALLBACK;
}

export function authSecret(): string {
  return resolve();
}

export function authSecretKey(): Uint8Array {
  return new TextEncoder().encode(resolve());
}
