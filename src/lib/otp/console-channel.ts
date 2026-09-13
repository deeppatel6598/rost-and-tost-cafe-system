import { maskPhone } from "@/lib/format";
import type { OtpChannel, SendResult } from "@/lib/otp/channel";

/**
 * The development channel: prints the code to the server log.
 *
 * This exists so the entire verification feature — routes, limits, expiry,
 * attempt caps, the acceptance suite — can be built and run with no vendor
 * account, no DLT registration and no spend. It is also where the harnesses
 * read the code from.
 *
 * Using it in production means every student's code lands in a log file, so it
 * takes two deliberate acts to get there: selecting it with OTP_PROVIDER, and
 * then allowing it with OTP_ALLOW_CONSOLE. The startup check refuses the first
 * without the second, which is why the suites — which run a production build —
 * set both, and a real deploy that fat-fingers OTP_PROVIDER fails at boot
 * instead of quietly leaking.
 */
export class ConsoleChannel implements OtpChannel {
  readonly name = "console";

  static allowedHere(): boolean {
    return process.env.NODE_ENV !== "production" || process.env.OTP_ALLOW_CONSOLE === "1";
  }

  healthy(): boolean {
    return ConsoleChannel.allowedHere();
  }

  async send(phone: string, code: string): Promise<SendResult> {
    if (!ConsoleChannel.allowedHere()) {
      return { ok: false, error: "The console channel is not allowed here." };
    }
    // The one place in the app where a live code is written down.
    console.info(`[otp] ${maskPhone(phone)} -> ${code}`);
    return { ok: true, ref: `console-${Date.now()}` };
  }
}
