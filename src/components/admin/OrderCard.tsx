"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatElapsed } from "@/lib/format";
import type { SubOrderView } from "@/lib/types";
import { StatusChip, PaymentBadge } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";

const NEXT_LABEL: Record<SubOrderView["status"], string | null> = {
  PLACED: "Accept",
  ACCEPTED: "Start cooking",
  PREPARING: "Mark ready",
  READY: "Collected",
  COMPLETED: null,
  CANCELLED: null,
};

export function OrderCard({
  order,
  flash,
  onOpen,
  onAdvance,
  onMarkRefunded,
}: {
  order: SubOrderView;
  flash: boolean;
  onOpen: () => void;
  onAdvance: () => void;
  onMarkRefunded?: () => void;
}) {
  // Re-render on a timer so "3 min" doesn't sit stale on a screen that's been
  // open all lunchtime.
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const nextLabel = NEXT_LABEL[order.status];
  const blockedOnPayment =
    order.paymentMethod === "upi" && order.status === "PLACED" && order.paymentStatus !== "CONFIRMED";
  const refundDue = order.paymentStatus === "REFUND_DUE";

  return (
    <article
      className={cn(
        "grid gap-3 rounded-xl border bg-surface p-4",
        order.status === "PLACED" ? "border-status-new" : "border-border",
        flash && "animate-rt-ring",
      )}
    >
      <button type="button" onClick={onOpen} className="grid gap-2 text-left">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold">{order.tokenNumber}</span>
          <span className="t-body-sm font-semibold text-text-muted">T{order.tableNumber}</span>
          <span className="t-caption ml-auto text-text-faint">{formatElapsed(order.createdAt)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={order.status} />
          <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
        </div>

        <div className="grid gap-1 border-t border-border pt-2">
          {order.items.map((line) => (
            <div key={line.id} className="flex gap-2 text-[15px]">
              <span className="t-mono font-semibold text-text-muted">{line.quantity}×</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{line.itemNameSnapshot}</span>
                {(line.variantNameSnapshot || line.addonsSnapshot.length > 0) && (
                  <span className="block truncate text-xs text-text-muted">
                    {[line.variantNameSnapshot, ...line.addonsSnapshot.map((a) => a.name)]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {order.specialInstructions && (
          <p className="rounded-md border border-status-preparing bg-status-preparing-bg px-2.5 py-1.5 text-[13px] font-semibold text-status-preparing-ink">
            {order.specialInstructions}
          </p>
        )}

        <span className="t-mono text-right text-[15px] font-semibold">{formatCurrency(order.total)}</span>
      </button>

      {refundDue && onMarkRefunded ? (
        <Button size="admin" variant="danger" fullWidth onClick={onMarkRefunded}>
          Mark refund sent
        </Button>
      ) : blockedOnPayment ? (
        <p className="rounded-md bg-surface-raised px-3 py-2 text-center text-[13px] font-medium text-text-muted">
          Waiting for payment — confirm it before cooking
        </p>
      ) : nextLabel ? (
        <Button size="admin" fullWidth onClick={onAdvance}>
          {nextLabel}
        </Button>
      ) : null}
    </article>
  );
}
