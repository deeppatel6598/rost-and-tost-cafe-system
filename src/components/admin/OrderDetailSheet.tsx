"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatElapsed, formatTimeLabel } from "@/lib/format";
import type { SubOrderView } from "@/lib/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { StatusChip, PaymentBadge } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";

const REASONS = ["Item unavailable", "Stall closing", "Other"];

const NEXT_LABEL: Record<SubOrderView["status"], string | null> = {
  PLACED: "Accept order",
  ACCEPTED: "Start cooking",
  PREPARING: "Mark ready",
  READY: "Mark collected",
  COMPLETED: null,
  CANCELLED: null,
};

export function OrderDetailSheet({
  order,
  onClose,
  onAdvance,
  onCancel,
  onConfirmPayment,
  onMarkRefunded,
}: {
  order: SubOrderView | null;
  onClose: () => void;
  onAdvance: () => void;
  onCancel: (reason: string, note?: string) => void;
  onConfirmPayment: () => void;
  onMarkRefunded: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!order) {
      setCancelling(false);
      setReason(REASONS[0]);
      setNote("");
    }
  }, [order]);

  if (!order) return null;

  const nextLabel = NEXT_LABEL[order.status];
  const canCancel = order.status === "PLACED" || order.status === "ACCEPTED";
  const blockedOnPayment =
    order.paymentMethod === "upi" && order.status === "PLACED" && order.paymentStatus !== "CONFIRMED";

  return (
    <BottomSheet open onClose={onClose} title={`Token ${order.tokenNumber}`} maxWidth="560px">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-3xl font-bold">{order.tokenNumber}</span>
          <span className="t-title-md">Table {order.tableNumber}</span>
          <span className="t-caption ml-auto text-text-faint">
            {formatTimeLabel(order.createdAt)} · {formatElapsed(order.createdAt)} ago
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={order.status} size="lg" />
          <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
        </div>

        {order.specialInstructions && (
          <p className="rounded-md border-2 border-status-preparing bg-status-preparing-bg px-4 py-3 text-[15px] font-semibold text-status-preparing-ink">
            Special instructions: {order.specialInstructions}
          </p>
        )}

        <div className="divide-y divide-border rounded-lg border border-border">
          {order.items.map((line) => (
            <div key={line.id} className="flex items-start gap-3 px-4 py-3">
              <span className="t-mono text-lg font-bold">{line.quantity}×</span>
              <span className="min-w-0 flex-1">
                <span className="t-title-sm block">{line.itemNameSnapshot}</span>
                {line.variantNameSnapshot && (
                  <span className="t-body-sm block text-text-muted">{line.variantNameSnapshot}</span>
                )}
                {line.addonsSnapshot.length > 0 && (
                  <span className="t-body-sm block text-text-muted">
                    {line.addonsSnapshot.map((a) => a.name).join(", ")}
                  </span>
                )}
              </span>
              <span className="t-mono">{formatCurrency(line.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-1 border-t border-border pt-3">
          {order.taxAmount > 0 && (
            <div className="flex justify-between text-[13px] text-text-muted">
              <span>Includes GST</span>
              <span className="t-mono">{formatCurrency(order.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="t-mono">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {order.status === "CANCELLED" && order.cancelReason && (
          <p className="t-body-sm rounded-md bg-status-cancelled-bg px-3 py-2 text-status-cancelled-ink">
            Cancelled: {order.cancelReason}
          </p>
        )}

        {order.paymentStatus === "REFUND_DUE" && (
          <div className="grid gap-2 rounded-md border border-danger bg-danger-bg p-3">
            <span className="t-title-sm text-danger">Refund owed: {formatCurrency(order.total)}</span>
            <span className="t-body-sm text-danger/85">
              Send this back on UPI{order.guestPhone ? ` — student's phone: ${order.guestPhone}` : ""}, then mark it
              here.
            </span>
            <Button size="admin" variant="danger" onClick={onMarkRefunded}>
              Mark refund sent
            </Button>
          </div>
        )}

        {cancelling ? (
          <div className="grid gap-2 rounded-md border border-danger bg-danger-bg p-3">
            <span className="t-overline text-danger">Why are you rejecting this?</span>
            <div className="grid gap-1.5">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-[15px]">
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="h-4 w-4 accent-[var(--danger)]"
                  />
                  {r}
                </label>
              ))}
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
              placeholder="Optional note for the student"
              className="h-11 rounded-md border border-border bg-surface px-3 text-[15px]"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button size="admin" variant="danger" onClick={() => onCancel(reason, note.trim() || undefined)}>
                Confirm reject
              </Button>
              <Button size="admin" variant="ghost" onClick={() => setCancelling(false)}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            {blockedOnPayment && (
              <Button size="admin" fullWidth onClick={onConfirmPayment}>
                Payment received — unblock
              </Button>
            )}
            {nextLabel && !blockedOnPayment && (
              <Button size="admin" fullWidth onClick={onAdvance}>
                {nextLabel}
              </Button>
            )}
            {canCancel && (
              <Button size="admin" variant="danger" fullWidth onClick={() => setCancelling(true)}>
                Reject order
              </Button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
