"use client";

import { useState } from "react";
import { formatCurrency, formatElapsed, formatTimeLabel } from "@/lib/format";
import type { Order } from "@/lib/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";

export function OrderDetailModal({
  order,
  onClose,
  onToggleLineDone,
  onAdvance,
  onCancel,
}: {
  order: Order | null;
  onClose: () => void;
  onToggleLineDone: (lineId: string, done: boolean) => void;
  onAdvance: () => void;
  onCancel: (reason: string) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  if (!order) return null;

  const nextLabel = order.status === "received" ? "Start preparing" : order.status === "preparing" ? "Mark served" : null;
  const canCancel = order.status === "received" || order.status === "preparing";

  return (
    <BottomSheet open={!!order} onClose={onClose} title={`Order #${order.id}`} maxWidth="560px">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="t-mono text-3xl font-semibold">Table {order.tableNumber}</span>
          <StatusChip status={order.status} size="lg" />
          <span className="t-caption ml-auto text-text-faint">
            Placed {formatTimeLabel(order.placedAt)} · {formatElapsed(order.placedAt)}
          </span>
        </div>

        {order.note && (
          <p className="t-body rounded-md border border-accent bg-accent-tint px-4 py-3 font-medium text-accent-active">
            Special instructions: {order.note}
          </p>
        )}

        <div className="grid gap-2 divide-y divide-border rounded-lg border border-border">
          {order.lines.map((line) => (
            <label key={line.id} className="flex items-start gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={line.done}
                disabled={order.status === "served" || order.status === "cancelled"}
                onChange={(e) => onToggleLineDone(line.id, e.target.checked)}
                className="mt-1 h-5 w-5 accent-[var(--accent)]"
                aria-label={`Mark ${line.name} done`}
              />
              <span className="flex-1">
                <span className={`t-title-sm block ${line.done ? "text-text-faint line-through" : ""}`}>
                  {line.qty}× {line.name}
                </span>
                {line.selectedOptions.length > 0 && (
                  <span className="t-body-sm block text-text-muted">{line.selectedOptions.map((o) => o.label).join(", ")}</span>
                )}
                {line.lineNote && (
                  <span className="t-body-sm mt-0.5 block rounded bg-status-preparing-bg px-2 py-1 font-medium text-status-preparing-ink">
                    {line.lineNote}
                  </span>
                )}
              </span>
              <span className="t-mono">{formatCurrency(line.amount)}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>

        {order.status === "cancelled" && order.cancelReason && (
          <p className="t-body-sm rounded-md bg-status-cancelled-bg px-3 py-2 text-status-cancelled-ink">
            Cancelled: {order.cancelReason}
          </p>
        )}

        {cancelling ? (
          <div className="grid gap-2 rounded-md border border-danger bg-danger-bg p-3">
            <label className="t-overline text-danger">Reason for cancelling</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              autoFocus
              className="t-body-sm resize-none rounded-md border border-border bg-surface px-3 py-2"
            />
            <div className="flex gap-2">
              <Button variant="danger" size="sm" disabled={!reason.trim()} onClick={() => onCancel(reason.trim())}>
                Confirm cancel
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCancelling(false)}>
                Never mind
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {nextLabel && (
              <Button size="admin" onClick={onAdvance} className="flex-1">
                {nextLabel}
              </Button>
            )}
            {canCancel && (
              <Button size="admin" variant="danger" onClick={() => setCancelling(true)}>
                Cancel order
              </Button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
