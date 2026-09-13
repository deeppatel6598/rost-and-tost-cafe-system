/**
 * How a one-time code reaches a student.
 *
 * Deliberately three methods and nothing else. Every provider-specific
 * concern — DLT template ids, sender headers, auth keys, JSON shapes — stays
 * behind this line, so choosing a vendor is a one-file change and the whole
 * feature can be built and tested before any vendor account exists.
 */
export interface SendResult {
  ok: boolean;
  /** The provider's own id for the message, kept for support tickets. */
  ref?: string;
  /** Safe to show staff; never shown to a student. */
  error?: string;
}

export interface OtpChannel {
  readonly name: string;
  /** `phone` is always a normalised ten-digit Indian mobile. */
  send(phone: string, code: string): Promise<SendResult>;
  /**
   * Whether the channel looks usable right now. Cheap and synchronous in
   * spirit — it answers "is this configured", not "is the carrier up", so the
   * supervisor screen can show a dead provider without probing it on a timer.
   */
  healthy(): boolean;
}
