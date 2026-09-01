"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { rememberOrder } from "@/lib/my-orders";
import { PHONE_HELP, isValidPhone } from "@/lib/phone";
import { newIdempotencyKey, submitOrder } from "@/lib/submit-order";
import type { PaymentMethod, StallView } from "@/lib/types";
import { GuestHeader } from "@/components/order/GuestHeader";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const MAX_INSTRUCTIONS = 120;

export function CheckoutClient({ tableNumber, stall }: { tableNumber: number; stall: StallView }) {
  const router = useRouter();
  const cart = useCart();

  const methods = useMemo(() => {
    const list: PaymentMethod[] = [];
    if (stall.acceptsUpi) list.push("upi");
    if (stall.acceptsCash) list.push("cash");
    return list;
  }, [stall.acceptsCash, stall.acceptsUpi]);

  const [method, setMethod] = useState<PaymentMethod | null>(methods.length === 1 ? methods[0] : null);
  const [instructions, setInstructions] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One key per checkout attempt. Reused across retries so a request that
  // actually landed replays instead of creating a second order.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  // The number is required, but the error only appears once they have left
  // the field or tried to order — nagging someone mid-typing is not help.
  const phoneOk = isValidPhone(phone);
  const showPhoneError = !phoneOk && phoneTouched;

  const lines = cart.stallId === stall.id ? cart.lines : [];

  useEffect(() => {
    if (lines.length === 0 && !submitting) router.replace(`/order/${stall.id}`);
  }, [lines.length, submitting, router, stall.id]);

  async function placeOrder() {
    if (!method) return;
    if (!phoneOk) {
      // Send them to the field rather than just refusing.
      setPhoneTouched(true);
      setError("Add your phone number before placing the order.");
      document.getElementById("guest-phone")?.focus();
      return;
    }
    setSubmitting(true);
    setError(null);
    setRetrying(false);

    try {
      const result = await submitOrder(
        {
          stallId: stall.id,
          paymentMethod: method,
          specialInstructions: instructions.trim() || undefined,
          guestPhone: phone,
          expectedTotal: cart.displayTotal,
          lines: lines.map((l) => ({
            itemId: l.itemId,
            variantId: l.variantId,
            addonIds: l.addonIds,
            quantity: l.quantity,
          })),
        },
        idempotencyKey,
        () => setRetrying(true),
      );

      rememberOrder({
        publicToken: result.publicToken,
        subOrderId: result.subOrder.id,
        tokenNumber: result.subOrder.tokenNumber,
        stallName: stall.name,
        placedAt: result.subOrder.createdAt,
      });

      cart.clear();
      router.replace(`/status/${result.publicToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order.");
      // A rejected attempt is finished — the next try is a new attempt, and
      // reusing the old key would replay a failure rather than retry cleanly.
      setIdempotencyKey(newIdempotencyKey());
      setSubmitting(false);
      setRetrying(false);
    }
  }

  if (lines.length === 0) return null;

  return (
    <>
      <GuestHeader tableNumber={tableNumber} title="Checkout" backHref={`/order/${stall.id}`} />

      <div className="flex-1 overflow-y-auto px-4 pb-[180px] pt-4">
        <p className="t-body-sm mb-4 text-text-muted">
          Ordering from <span className="font-semibold text-text">{stall.name}</span>. This bill is settled with
          that stall.
        </p>

        <section className="mb-5 grid gap-1 rounded-xl border border-border bg-surface p-4">
          {lines.map((line) => (
            <div key={line.lineId} className="flex gap-3 py-1 text-[15px]">
              <span className="t-mono text-text-muted">{line.quantity}×</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{line.name}</span>
                {(line.variantName || line.addonNames.length > 0) && (
                  <span className="block truncate text-xs text-text-faint">
                    {[line.variantName, ...line.addonNames].filter(Boolean).join(", ")}
                  </span>
                )}
              </span>
              <span className="t-mono">{formatCurrency(line.unitPrice * line.quantity)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-border pt-2.5 font-semibold">
            <span>Total</span>
            <span className="t-mono">{formatCurrency(cart.displayTotal)}</span>
          </div>
          {stall.gstin && (
            <p className="t-caption text-text-faint">
              Includes GST at 5% · GSTIN {stall.gstin}
            </p>
          )}
        </section>

        <label className="mb-5 grid gap-1.5">
          <span className="t-overline text-text-faint">Anything the kitchen should know?</span>
          <textarea
            value={instructions}
            maxLength={MAX_INSTRUCTIONS}
            rows={2}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. less spicy, no onion"
            className="resize-none rounded-md border border-border bg-surface px-3 py-2 text-[15px] placeholder:text-text-faint focus:border-accent"
          />
          <span className="t-caption text-right text-text-faint">
            {instructions.length}/{MAX_INSTRUCTIONS}
          </span>
        </label>

        <label className="mb-6 grid gap-1.5">
          <span className="t-overline text-text-faint">
            Phone number <span className="text-accent">*</span>
          </span>
          <input
            type="tel"
            inputMode="numeric"
            id="guest-phone"
            autoComplete="tel"
            required
            value={phone}
            maxLength={10}
            aria-invalid={showPhoneError ? "true" : undefined}
            aria-describedby="phone-help"
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            onBlur={() => setPhoneTouched(true)}
            placeholder="10-digit number"
            className={cn(
              "h-12 rounded-md border bg-surface px-3 text-[15px] placeholder:text-text-faint focus:border-accent",
              showPhoneError ? "border-danger" : "border-border",
            )}
          />
          <span
            id="phone-help"
            className={cn("t-caption", showPhoneError ? "text-danger" : "text-text-faint")}
          >
            {showPhoneError
              ? PHONE_HELP
              : "Required. The stall calls this number if there's a problem, and it finds your order if you lose this page."}
          </span>
        </label>

        <fieldset className="grid gap-3">
          <legend className="t-overline mb-2 text-text-faint">How are you paying?</legend>

          {methods.length === 0 && (
            <p className="t-body-sm rounded-md bg-status-cancelled-bg px-3 py-2 text-status-cancelled-ink">
              This stall is not taking payments right now. Please order at the counter.
            </p>
          )}

          {methods.includes("upi") && (
            <button
              type="button"
              onClick={() => setMethod("upi")}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left",
                method === "upi" ? "border-accent bg-accent-tint" : "border-border bg-surface",
              )}
            >
              <span aria-hidden="true" className="text-2xl">
                ▣
              </span>
              <span className="flex-1">
                <span className="t-title-sm block">Pay now with UPI</span>
                <span className="t-body-sm block text-text-muted">
                  Opens GPay, PhonePe or Paytm with the amount filled in
                </span>
              </span>
              <span
                className={cn(
                  "h-5 w-5 shrink-0 rounded-full border-2",
                  method === "upi" ? "border-accent bg-accent" : "border-border-strong",
                )}
              />
            </button>
          )}

          {methods.includes("cash") && (
            <button
              type="button"
              onClick={() => setMethod("cash")}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left",
                method === "cash" ? "border-accent bg-accent-tint" : "border-border bg-surface",
              )}
            >
              <span aria-hidden="true" className="text-2xl">
                ₹
              </span>
              <span className="flex-1">
                <span className="t-title-sm block">Pay cash at the counter</span>
                <span className="t-body-sm block text-text-muted">
                  Order goes to the kitchen now, pay when you collect
                </span>
              </span>
              <span
                className={cn(
                  "h-5 w-5 shrink-0 rounded-full border-2",
                  method === "cash" ? "border-accent bg-accent" : "border-border-strong",
                )}
              />
            </button>
          )}
        </fieldset>

        {error && (
          <p className="t-body-sm mt-4 rounded-md bg-danger-bg px-3 py-2.5 text-danger" role="alert">
            {error}
          </p>
        )}
        {retrying && !error && (
          <p className="t-body-sm mt-4 rounded-md bg-status-preparing-bg px-3 py-2.5 text-status-preparing-ink" role="status">
            Weak connection — still trying to send your order. Keep this screen open.
          </p>
        )}
      </div>

      <div className="sticky bottom-0 z-20 flex-none border-t border-border bg-surface px-4 py-3">
        <Button size="hero" fullWidth disabled={!method || submitting} onClick={placeOrder}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <Spinner /> Sending to {stall.name}…
            </span>
          ) : (
            `Place order · ${formatCurrency(cart.displayTotal)}`
          )}
        </Button>
        <p className="t-caption mt-2 text-center text-text-faint">
          {!phoneOk
            ? "Add your phone number above to place this order."
            : method === "upi"
              ? "You'll pay on the next screen, then the stall confirms it."
              : "Goes straight to the kitchen. Pay at the counter when you collect."}
        </p>
      </div>
    </>
  );
}
