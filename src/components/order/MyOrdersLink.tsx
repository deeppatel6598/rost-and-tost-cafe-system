"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listRememberedOrders } from "@/lib/my-orders";

/** Only appears once this browser has actually placed something. */
export function MyOrdersLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(listRememberedOrders().length);
  }, []);

  if (count === 0) return null;

  return (
    <Link
      href="/orders"
      className="flex h-9 items-center gap-1.5 rounded-pill border border-border bg-surface-raised px-3 text-[13px] font-semibold text-text no-underline"
    >
      My orders
      <span className="t-mono text-[11px] text-text-muted">{count}</span>
    </Link>
  );
}
