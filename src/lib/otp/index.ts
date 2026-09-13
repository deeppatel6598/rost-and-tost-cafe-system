import type { OtpChannel } from "@/lib/otp/channel";
import { ConsoleChannel } from "@/lib/otp/console-channel";
import { Msg91Channel } from "@/lib/otp/msg91-channel";

export type { OtpChannel, SendResult } from "@/lib/otp/channel";

/**
 * Which channel is in use, chosen by OTP_PROVIDER.
 *
 * Defaults to the console stub outside production and to MSG91 inside it, so
 * a deploy that forgets the variable fails loudly on a missing auth key rather
 * than quietly logging students' codes to a server log.
 */
let cached: OtpChannel | undefined;

export function otpChannel(): OtpChannel {
  if (cached) return cached;
  const configured = process.env.OTP_PROVIDER ?? (process.env.NODE_ENV === "production" ? "msg91" : "console");
  cached = configured === "console" ? new ConsoleChannel() : new Msg91Channel();
  return cached;
}

/** Test seam — lets the suites assert behaviour without a live provider. */
export function __setOtpChannel(channel: OtpChannel | undefined): void {
  cached = channel;
}
