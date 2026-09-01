/**
 * Guest phone numbers.
 *
 * The number is how a stall reaches a student whose food has gone cold at the
 * counter, and how staff find an order when the student has closed the page
 * and forgotten their token. It is required on every order, so the rule that
 * decides what counts as a number lives here and is applied on both sides:
 * the checkout screen for a useful error, and the server for the actual gate.
 */

/** Message shown wherever a number fails the check. Kept in one place so the
 *  screen and the API cannot drift apart on what they ask for. */
export const PHONE_HELP = "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.";

/**
 * Reduces what a student typed to ten digits.
 *
 * People type +91, 0 prefixes, spaces and dashes, and none of that should be
 * a rejection — it is the same number written differently.
 */
export function normalisePhone(raw: string | undefined | null): string {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

/** True for a plausible Indian mobile number, already normalised or not. */
export function isValidPhone(raw: string | undefined | null): boolean {
  return /^[6-9]\d{9}$/.test(normalisePhone(raw));
}
