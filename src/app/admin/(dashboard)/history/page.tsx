"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDayLabel, formatTimeLabel } from "@/lib/format";
import type { Order } from "@/lib/types";
import { StatusChip } from "@/components/ui/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    return q ? orders.filter((o) => String(o.tableNumber) === q || o.id.toLowerCase().includes(q.toLowerCase())) : orders;
  }, [orders, search]);

  const groups = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of filtered) {
      const day = order.placedAt.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(order);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  if (loading) return null;

  return (
    <div className="grid gap-5 px-[var(--gutter-admin)] py-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="t-display-sm">Order history</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by table number or order id"
          className="ml-auto h-11 w-72 max-w-full rounded-md border border-border bg-surface px-3"
        />
      </div>

      {groups.length === 0 && <EmptyState glyph="🕘" title="No orders yet" body="Orders placed by guests will show up here, grouped by day." />}

      {groups.map(([day, dayOrders]) => (
        <div key={day} className="grid gap-2">
          <span className="t-overline text-text-faint">{formatDayLabel(dayOrders[0].placedAt)}</span>
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {dayOrders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <span className="t-mono font-semibold">#{order.id}</span>
                <span className="t-body-sm text-text-muted">Table {order.tableNumber}</span>
                <span className="t-caption text-text-faint">{formatTimeLabel(order.placedAt)}</span>
                <StatusChip status={order.status} />
                <span className="ml-auto t-mono">{formatCurrency(order.total)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
