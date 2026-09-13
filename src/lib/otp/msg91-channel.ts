import { maskPhone } from "@/lib/format";
import type { OtpChannel, SendResult } from "@/lib/otp/channel";

/**
 * MSG91, over the DLT-registered transactional route.
 *
 * We generate and store the code ourselves (hashed), so this uses the Flow
 * API — which sends a registered template with our variable — rather than
 * MSG91's OTP Manager, which would generate, hold and verify the code on
 * their side. Keeping the code ours is what lets attempt caps, expiry and
 * single-use live in our own transaction alongside everything else.
 *
 * Three things must exist on the MSG91 side before this works, and all three
 * come out of DLT registration rather than the dashboard:
 *
 *   MSG91_AUTH_KEY   the account key
 *   MSG91_FLOW_ID    the approved template, whose body must match the DLT
 *                    content template exactly, including punctuation
 *   MSG91_SENDER_ID  the six-character DLT header, e.g. SKCANT
 *
 * The template has exactly one variable — the code. Anything else in it is
 * fixed text that DLT has already approved, so it cannot be built here.
 */
const ENDPOINT = "https://api.msg91.com/api/v5/flow/";

/** MSG91 wants the country code; our numbers are stored as ten digits. */
function toInternational(phone: string): string {
  return `91${phone}`;
}

export class Msg91Channel implements OtpChannel {
  readonly name = "msg91";

  private readonly authKey = process.env.MSG91_AUTH_KEY ?? "";
  private readonly flowId = process.env.MSG91_FLOW_ID ?? "";
  private readonly senderId = process.env.MSG91_SENDER_ID ?? "";

  healthy(): boolean {
    return Boolean(this.authKey && this.flowId && this.senderId);
  }

  async send(phone: string, code: string): Promise<SendResult> {
    if (!this.healthy()) {
      return { ok: false, error: "MSG91 is not configured (auth key, flow id or sender id missing)." };
    }

    // A student is waiting on this screen. Better to fail fast and let them
    // retry than to hold the request open while a carrier decides.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", authkey: this.authKey },
        body: JSON.stringify({
          flow_id: this.flowId,
          sender: this.senderId,
          recipients: [{ mobiles: toInternational(phone), OTP: code }],
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      const body = (await response.json().catch(() => null)) as
        | { type?: string; message?: string; request_id?: string }
        | null;

      // MSG91 answers 200 with {"type":"error"} for template and balance
      // problems, so the status code alone is not the answer.
      if (!response.ok || body?.type === "error") {
        const error = body?.message ?? `MSG91 responded ${response.status}`;
        console.error(`[otp] msg91 refused ${maskPhone(phone)}: ${error}`);
        return { ok: false, error };
      }

      return { ok: true, ref: body?.request_id };
    } catch (err) {
      const error = err instanceof Error && err.name === "AbortError"
        ? "MSG91 did not respond within 8 seconds."
        : err instanceof Error
          ? err.message
          : "MSG91 request failed.";
      console.error(`[otp] msg91 failed for ${maskPhone(phone)}: ${error}`);
      return { ok: false, error };
    } finally {
      clearTimeout(timeout);
    }
  }
}
