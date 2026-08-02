"use client";

import { formatCurrency } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";

const HEADLINES: Record<OrderStatus, [string, string]> = {
  received: ["Sent to the kitchen", "They have your round. We'll bring it over as soon as it's up."],
  preparing: ["The kitchen has it", "On the pass now — usually eight to twelve minutes at this hour."],
  served: ["Delivered to your table", "Everything on this round has left the kitchen. Order another whenever."],
  cancelled: ["This round was cancelled", "Ask a team member at the counter if you'd like to reorder."],
};

const STEPS: OrderStatus[] = ["received", "preparing", "served"];

export function PlacedView({ order, onAddMore }: { order: Order; onAddMore?: () => void }) {
  const [headline, body] = HEADLINES[order.status];
  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip status={order.status} size="lg" />
          <span className="t-caption text-text-faint">Order #{order.id} · Table {order.tableNumber}</span>
        </div>
        <span className="t-display-sm">{headline}</span>
        <span className="t-body text-text-muted">{body}</span>

        {order.status !== "cancelled" && (
          <div className="mt-1 flex items-center gap-2" aria-hidden="true">
            {STEPS.map((step, i) => (
              <div key={step} className="flex flex-1 items-center gap-2">
                <span
                  className={`h-2 flex-1 rounded-pill ${i <= stepIndex ? "bg-accent" : "bg-border-strong"}`}
                />
              </div>
            ))}
          </div>
        )}
        {order.status === "cancelled" && order.cancelReason && (
          <span className="t-body-sm rounded-md bg-status-cancelled-bg px-3 py-2 text-status-cancelled-ink">
            Reason: {order.cancelReason}
          </span>
        )}
      </div>

      <div className="grid gap-2 rounded-lg border border-border bg-surface px-5 py-4">
        <span className="t-overline text-text-faint">Round {order.round}</span>
        {order.lines.map((line) => (
          <div key={line.id} className="flex gap-3 py-1.5 text-[15px] text-text-body">
            <span className="t-mono text-text-muted">{line.qty}×</span>
            <span className="flex-1">
              {line.name}
              {line.selectedOptions.length > 0 && (
                <span className="block text-xs text-text-faint">{line.selectedOptions.map((o) => o.label).join(", ")}</span>
              )}
            </span>
            <span className="t-mono">{formatCurrency(line.amount)}</span>
          </div>
        ))}
        {order.note && <span className="t-body-sm italic text-text-faint">Note: {order.note}</span>}
        <div className="flex justify-between border-t border-border pt-3 font-semibold">
          <span>Total</span>
          <span className="t-display-xs">{formatCurrency(order.total)}</span>
        </div>
      </div>

      {onAddMore && (
        <>
          <span className="t-body-sm text-center text-text-faint">Later rounds join the same table bill. Pay once, at the counter.</span>
          <Button size="hero" fullWidth onClick={onAddMore}>
            Add more items
          </Button>
        </>
      )}
    </div>
  );
}
