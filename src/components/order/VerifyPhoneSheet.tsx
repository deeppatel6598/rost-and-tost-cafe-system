"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { CodeEntry } from "@/components/order/CodeEntry";

/**
 * "See all my orders" — proving this phone holds the number.
 *
 * Offered whenever the sitting has a number this browser has not proved, and
 * never conditioned on whether there are in fact more orders to show: saying
 * "you have orders elsewhere" would confirm to someone who typed a guessed
 * number that the guess was real.
 *
 * Nothing here blocks ordering. A student who skips it keeps the token they
 * collect their food with; what they give up is seeing sittings from other
 * tables on this phone.
 */
export function VerifyPhoneSheet({
  open,
  phone,
  onClose,
  onVerified,
}: {
  open: boolean;
  phone: string;
  onClose: () => void;
  onVerified: () => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="See all your orders">
      <CodeEntry
        phone={phone}
        purpose="verify_device"
        submitLabel="Verify this phone"
        onVerified={async (code) => {
          const res = await fetch("/api/verify/check", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ phone, code }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) return { ok: false, error: data?.error };
          onClose();
          onVerified();
          return { ok: true };
        }}
      />

      <p className="t-caption mt-4 text-text-faint">
        We only ask once. This phone will remember you for the rest of the term.
      </p>
    </BottomSheet>
  );
}
