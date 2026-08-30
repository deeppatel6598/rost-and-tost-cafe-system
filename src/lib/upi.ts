import type { Stall } from "@/lib/types";

/**
 * Builds a UPI intent link.
 *
 * Tapping this on a phone opens GPay / PhonePe / Paytm — whichever UPI app is
 * installed — with the payee, amount and note pre-filled, so the student only
 * has to approve it. This is the primary payment path, not the QR code: the
 * student is ordering *on* their phone, and a phone cannot scan a QR code
 * displayed on its own screen. The QR is a fallback for someone paying from a
 * second device.
 *
 * Note there is no gateway here and no callback. Money moves directly between
 * the student and the stall's own UPI account, which is exactly why a stall
 * member has to verify receipt in their own app before the order can proceed.
 */
export function buildUpiLink(stall: Stall, amount: number, tokenNumber: string): string {
  const params = new URLSearchParams({
    pa: stall.upiVpa,
    pn: stall.upiPayeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `${tokenNumber} SK Canteen`,
  });
  return `upi://pay?${params.toString()}`;
}
