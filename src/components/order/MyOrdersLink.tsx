"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Shows the number of orders still worth watching.
 *
 * It counts *live* orders from the server, not everything this browser has
 * ever placed — the old badge read a capped local-storage list once on mount,
 * so a student who had eaten here five times saw a permanent "5" long after
 * every one of those orders was collected.
 */
export function MyOrdersLink() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/my-orders");
        if (!res.ok) return;
        const data = await res.json();
        const live = (data.subOrders ?? []).filter(
          (o: { status: string }) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
        ).length;
        if (!cancelled) setCount(live);
      } catch {
        /* leave the link hidden rather than guess */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null || count === 0) return null;

  return (
    <Link
      href="/orders"
      className="flex h-11 items-center gap-1.5 rounded-pill border border-border bg-surface-raised px-3.5 text-[13px] font-semibold text-text no-underline"
    >
      <Icon name="receipt" size={15} />
      My orders
      <span className="t-mono grid h-5 min-w-[20px] place-items-center rounded-pill bg-accent-fill px-1 text-[11px] text-accent-on">
        {count}
      </span>
    </Link>
  );
}
