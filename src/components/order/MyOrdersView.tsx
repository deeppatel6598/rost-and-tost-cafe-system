"use client";

import type { Order } from "@/lib/types";
import { PlacedView } from "@/components/order/PlacedView";
import { Button } from "@/components/ui/Button";

export function MyOrdersView({
  orders,
  onBack,
  onAddMore,
}: {
  orders: Order[];
  onBack: () => void;
  onAddMore: () => void;
}) {
  const newestFirst = [...orders].reverse();

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="grid h-11 w-11 place-items-center rounded-md border border-border bg-surface-raised text-text"
        >
          ←
        </button>
        <span className="t-display-xs">Your orders at this table</span>
      </div>

      <div className="grid gap-6">
        {newestFirst.map((order) => (
          <PlacedView key={order.id} order={order} />
        ))}
      </div>

      <span className="t-body-sm text-center text-text-faint">Every round joins the same table bill. Pay once, at the counter.</span>
      <Button size="hero" fullWidth onClick={onAddMore}>
        Add more items
      </Button>
    </div>
  );
}
