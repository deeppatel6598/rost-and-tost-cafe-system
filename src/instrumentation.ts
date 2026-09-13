/**
 * Startup checks.
 *
 * Without this, a deployment missing AUTH_SECRET or DATABASE_URL still boots
 * happily and fails later, one request at a time, as a redirect to
 * "table not found" that looks like a broken QR sticker. That is the worst
 * possible way to learn about it — during a lunch rush, from a student.
 *
 * Reading the values here forces the same validation at boot, so a misconfigured
 * deploy dies immediately and visibly instead.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { authSecret } = await import("@/lib/secret");
  authSecret();

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Point it at the Supabase pooled connection string (port 6543).",
    );
  }

  console.info("[boot] configuration checks passed");
}
