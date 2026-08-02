import { cn } from "@/lib/cn";
import type { Order } from "@/lib/types";

const DOT_COLOR: Record<Order["status"], string> = {
  received: "bg-status-new",
  preparing: "bg-status-preparing",
  served: "bg-status-served",
  cancelled: "bg-status-cancelled",
};

/**
 * Small persistent corner button so a guest can check on an order they
 * already placed without having to place another one to see it again.
 * Shows a coloured dot for the most recently placed round's status.
 */
export function MyOrdersButton({ orders, onClick }: { orders: Order[]; onClick: () => void }) {
  if (orders.length === 0) return null;
  const latest = orders[orders.length - 1];
  const openCount = orders.filter((o) => o.status === "received" || o.status === "preparing").length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 items-center gap-2 rounded-pill border border-border bg-surface-raised pl-3 pr-3.5 text-[13px] font-semibold text-text"
    >
      <span className={cn("h-2 w-2 rounded-full", DOT_COLOR[latest.status], latest.status === "received" && "animate-rt-pulse")} aria-hidden="true" />
      My order
      {openCount > 1 && <span className="t-mono text-[11px] text-text-muted">×{openCount}</span>}
    </button>
  );
}
