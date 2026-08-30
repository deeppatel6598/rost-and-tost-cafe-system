"use client";

import { formatCurrency, formatElapsed } from "@/lib/format";
import type { SubOrderView } from "@/lib/types";
import { Button } from "@/components/ui/Button";

/**
 * A UPI order where the student has tapped "I have paid".
 *
 * This is a claim, not a payment. Staff check their own UPI app for the
 * amount and reference, then confirm or reject here — which is the only path
 * to CONFIRMED, and the only thing that unblocks cooking.
 */
export function AwaitingPaymentCard({
  order,
  onConfirm,
  onReject,
  onOpen,
}: {
  order: SubOrderView;
  onConfirm: () => void;
  onReject: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="grid gap-3 rounded-xl border-2 border-status-preparing bg-status-preparing-bg p-4">
      <button type="button" onClick={onOpen} className="grid gap-1.5 text-left">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold text-status-preparing-ink">{order.tokenNumber}</span>
          <span className="t-body-sm font-semibold text-status-preparing-ink/80">T{order.tableNumber}</span>
          <span className="t-caption ml-auto text-status-preparing-ink/70">{formatElapsed(order.createdAt)}</span>
        </div>

        <span className="font-mono text-3xl font-bold text-status-preparing-ink">
          {formatCurrency(order.total)}
        </span>

        <span className="t-body-sm text-status-preparing-ink/85">
          {order.upiReference ? (
            <>
              Reference: <span className="font-mono font-semibold">{order.upiReference}</span>
            </>
          ) : (
            "No reference given — match by amount and time."
          )}
        </span>

        <span className="t-caption text-status-preparing-ink/70">
          {order.items.length} item{order.items.length === 1 ? "" : "s"} · tap for detail
        </span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <Button size="admin" onClick={onConfirm}>
          Payment received
        </Button>
        <Button size="admin" variant="danger" onClick={onReject}>
          Not received
        </Button>
      </div>
      <p className="text-center text-[12px] text-status-preparing-ink/75">
        Check your own UPI app before confirming.
      </p>
    </article>
  );
}
