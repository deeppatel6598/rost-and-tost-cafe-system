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

  const isProduction = process.env.NODE_ENV === "production";

  const { authSecret } = await import("@/lib/secret");
  authSecret();

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Point it at the Supabase pooled connection string (port 6543).",
    );
  }

  // Read straight from the environment rather than importing the channel:
  // this module is also bundled for the Edge runtime, where node's crypto —
  // which the channels reach through maskPhone — does not resolve. The check
  // is about configuration, and configuration is env vars.
  const provider = process.env.OTP_PROVIDER ?? (isProduction ? "msg91" : "console");

  if (provider === "console") {
    if (isProduction && process.env.OTP_ALLOW_CONSOLE !== "1") {
      throw new Error(
        'OTP_PROVIDER is set to "console", which writes every student\'s verification code to the ' +
          "server log. Set OTP_PROVIDER=msg91 for a real deployment, or OTP_ALLOW_CONSOLE=1 if this " +
          "is a test environment and you mean it.",
      );
    }
    if (isProduction) {
      console.warn("[boot] OTP codes are being written to the server log (console channel).");
    }
  } else if (!process.env.MSG91_AUTH_KEY || !process.env.MSG91_FLOW_ID || !process.env.MSG91_SENDER_ID) {
    // Not fatal: verification degrades to "ask at the counter", and refusing to
    // boot would take the whole canteen down over a feature that is allowed to
    // be unavailable. Loud, though — nobody should discover this from a student.
    console.warn(
      "[boot] MSG91 is not fully configured (need MSG91_AUTH_KEY, MSG91_FLOW_ID, MSG91_SENDER_ID). " +
        "Phone verification will be unavailable.",
    );
  }

  console.info(`[boot] configuration checks passed (otp channel: ${provider})`);
}
