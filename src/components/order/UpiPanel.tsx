"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import type { SubOrderView } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

type Order = SubOrderView & { upiLink: string | null; upiVpa: string | null };

/**
 * The UPI payment step.
 *
 * The deep link is the primary action, not the QR code. The student is
 * ordering on their own phone, and a phone cannot scan a QR displayed on its
 * own screen — so the tappable `upi://` link that opens their payment app
 * with the amount pre-filled is the real path, and the QR is collapsed below
 * as a fallback for someone paying from a second device.
 *
 * Nothing here confirms payment. Tapping "I have paid" only records a claim;
 * a member of stall staff has to see the money arrive in their own UPI app.
 */
export function UpiPanel({
  publicToken,
  order,
  onUpdated,
}: {
  publicToken: string;
  order: Order;
  onUpdated: () => void | Promise<void>;
}) {
  const { showToast } = useToast();
  const [reference, setReference] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const claimed = order.paymentStatus === "AWAITING_CONFIRMATION";
  const failed = order.paymentStatus === "FAILED";

  useEffect(() => {
    if (!showQr || qrDataUrl || !order.upiLink) return;
    let cancelled = false;
    // Loaded on demand so the QR library never costs anything for the common
    // case, where the student just taps the deep link.
    import("qrcode")
      .then((mod) =>
        mod.toDataURL(order.upiLink!, {
          margin: 1,
          width: 240,
          color: { dark: "#141413", light: "#ffffff" },
        }),
      )
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) showToast("Could not draw the QR code.", "danger");
      });
    return () => {
      cancelled = true;
    };
  }, [showQr, qrDataUrl, order.upiLink, showToast]);

  async function claimPaid() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${publicToken}/${order.id}/paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await onUpdated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not record that.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  if (claimed) {
    return (
      <div className="grid gap-2 rounded-xl border border-status-preparing bg-status-preparing-bg p-4 text-center">
        <span className="t-title-sm text-status-preparing-ink">Waiting for the stall to confirm your payment</span>
        <span className="t-body-sm text-status-preparing-ink/85">
          {order.stallName} is checking their UPI app. Cooking starts as soon as they confirm — this usually takes
          under a minute.
        </span>
        {order.upiReference && (
          <span className="t-caption text-status-preparing-ink/70">Reference: {order.upiReference}</span>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-xl border border-accent bg-accent-tint p-4">
      {failed && (
        <p className="t-body-sm rounded-md bg-danger-bg px-3 py-2 text-danger">
          {order.stallName} could not find that payment. Please try again or pay cash at the counter.
        </p>
      )}

      <div className="text-center">
        <span className="t-overline block text-text-muted">Pay {order.stallName}</span>
        <span className="font-mono text-4xl font-semibold">{formatCurrency(order.total)}</span>
      </div>

      {order.upiLink && (
        <a href={order.upiLink} className="no-underline">
          <Button size="hero" fullWidth>
            Pay {formatCurrency(order.total)} with UPI app
          </Button>
        </a>
      )}

      {order.upiVpa && (
        <p className="t-caption text-center text-text-muted">
          UPI ID: <span className="select-all font-mono text-text">{order.upiVpa}</span>
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowQr((v) => !v)}
        className="t-caption text-center text-text-muted underline"
      >
        {showQr ? "Hide QR code" : "Paying from another device?"}
      </button>

      {showQr && (
        <div className="grid justify-items-center gap-2 rounded-lg bg-white p-3">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt={`UPI payment QR for ${formatCurrency(order.total)}`} width={200} height={200} />
          ) : (
            <Spinner className="h-6 w-6 text-ink-500" />
          )}
          <span className="text-[11px] text-ink-500">Scan from another phone</span>
        </div>
      )}

      <div className="grid gap-2 border-t border-accent/30 pt-3">
        <label className="grid gap-1">
          <span className="t-caption text-text-muted">UPI reference number (optional)</span>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Helps the stall find your payment"
            maxLength={40}
            className="h-11 rounded-md border border-border bg-surface px-3 text-[15px] placeholder:text-text-faint focus:border-accent"
          />
        </label>
        <Button variant="secondary" size="guest" fullWidth disabled={submitting} onClick={claimPaid}>
          {submitting ? <Spinner /> : "I have paid"}
        </Button>
        <p className="t-caption text-center text-text-faint">
          The stall checks their UPI app before starting your order.
        </p>
      </div>
    </div>
  );
}
