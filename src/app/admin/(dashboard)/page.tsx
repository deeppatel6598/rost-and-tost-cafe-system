"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Order } from "@/lib/types";
import { OrderCard } from "@/components/admin/OrderCard";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

type Filter = "open" | "received" | "preparing" | "served";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "received", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "served", label: "Served" },
];

export default function LiveOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("open");
  const [detailId, setDetailId] = useState<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (res.ok) {
        const fresh: Order[] = data.orders;
        const newOnes = fresh.filter((o) => o.status === "received" && !knownIds.current.has(o.id));
        if (knownIds.current.size > 0 && newOnes.length > 0) {
          showToast(`New order — Table ${newOnes[0].tableNumber}`, "success");
        }
        fresh.forEach((o) => knownIds.current.add(o.id));
        setOrders(fresh);
      }
    } catch {
      /* keep showing the last known board on transient network errors */
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function advance(id: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "advance" }),
    });
    load();
  }

  async function toggleLineDone(orderId: string, lineId: string, done: boolean) {
    await fetch(`/api/orders/${orderId}/lines/${lineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    load();
  }

  async function cancel(id: string, reason: string) {
    await fetch(`/api/orders/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setDetailId(null);
    load();
  }

  const visible = orders.filter((o) => (filter === "open" ? o.status === "received" || o.status === "preparing" : o.status === filter));
  const detailOrder = orders.find((o) => o.id === detailId) ?? null;

  return (
    <div className="grid gap-5 px-[var(--gutter-admin)] py-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "h-11 rounded-pill border px-[18px] text-sm font-semibold transition-colors duration-base",
              filter === f.id ? "border-accent bg-accent-tint text-accent-active" : "border-border text-text-muted hover:text-text",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Spinner className="h-7 w-7 text-accent" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState glyph="✓" title="Nothing waiting" body="Every order in this filter has been served. New ones land here on their own." />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {visible.map((order) => (
            <OrderCard key={order.id} order={order} onAdvance={() => advance(order.id)} onOpenDetail={() => setDetailId(order.id)} />
          ))}
        </div>
      )}

      <OrderDetailModal
        order={detailOrder}
        onClose={() => setDetailId(null)}
        onToggleLineDone={(lineId, done) => detailOrder && toggleLineDone(detailOrder.id, lineId, done)}
        onAdvance={() => detailOrder && advance(detailOrder.id)}
        onCancel={(reason) => detailOrder && cancel(detailOrder.id, reason)}
      />
    </div>
  );
}
