"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatElapsed } from "@/lib/format";
import type { Order } from "@/lib/types";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";

const NEXT_LABEL: Record<Order["status"], string | null> = {
  received: "Start preparing",
  preparing: "Mark served",
  served: null,
  cancelled: null,
};

export function OrderCard({
  order,
  onAdvance,
  onOpenDetail,
}: {
  order: Order;
  onAdvance: () => void;
  onOpenDetail: () => void;
}) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const nextLabel = NEXT_LABEL[order.status];
  const isNew = order.status === "received";

  return (
    <article
      className={cn(
        "grid gap-3 rounded-lg border bg-surface p-4",
        isNew ? "border-status-new shadow-2" : "border-border",
      )}
      style={isNew ? { boxShadow: "0 0 0 3px var(--status-new-bg)" } : undefined}
    >
      <button type="button" onClick={onOpenDetail} className="grid gap-3 text-left">
        <div className="flex items-center gap-3">
          <span className="t-mono text-2xl font-semibold">T{order.tableNumber}</span>
          <StatusChip status={order.status} />
          <span className="t-caption ml-auto text-text-faint">{formatElapsed(order.placedAt)}</span>
        </div>
        <div className="grid gap-1">
          {order.lines.map((line) => (
            <div key={line.id} className="flex gap-2 text-[15px] text-text-body">
              <span className="t-mono text-text-muted">{line.qty}×</span>
              <span className="flex-1 truncate">{line.name}</span>
            </div>
          ))}
        </div>
        {order.note && (
          <p className="t-body-sm rounded-md bg-accent-tint px-3 py-2 text-accent-active">Note: {order.note}</p>
        )}
        <div className="flex items-center justify-between t-caption text-text-faint">
          <span>Order #{order.id} · Round {order.round}</span>
          <span className="t-mono text-text">{formatCurrency(order.total)}</span>
        </div>
      </button>

      {nextLabel && (
        <Button size="admin" fullWidth onClick={onAdvance}>
          {nextLabel}
        </Button>
      )}
    </article>
  );
}
