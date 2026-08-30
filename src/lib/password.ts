import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Password hashing for staff accounts. scrypt from Node's stdlib — no native
 * dependency to build, and memory-hard so a leaked hash list is expensive to
 * attack.
 *
 * N is set below Node's default (16384) deliberately: seeded accounts are
 * hashed at process start, and on a cold serverless boot the default cost
 * adds most of a second before the first request is served. 8192 still puts a
 * single guess far out of reach for the threat model here (staff logins on a
 * campus canteen tool), and the cost parameter is stored in the hash string
 * so it can be raised later without invalidating existing hashes.
 */
const SCRYPT_COST = 8192;
const KEY_LENGTH = 32;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_COST, r: 8, p: 1 });
  return `scrypt$${SCRYPT_COST}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;

  const cost = Number(parts[1]);
  if (!Number.isInteger(cost) || cost < 1024) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[2], "hex");
    expected = Buffer.from(parts[3], "hex");
  } catch {
    return false;
  }
  if (expected.length !== KEY_LENGTH) return false;

  const derived = scryptSync(password, salt, KEY_LENGTH, { N: cost, r: 8, p: 1 });
  return timingSafeEqual(derived, expected);
}
