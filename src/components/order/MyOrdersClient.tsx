"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatElapsed } from "@/lib/format";
import type { SubOrderView } from "@/lib/types";
import { StatusChip, PaymentBadge } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { RecoverOrderSheet } from "@/components/order/RecoverOrderSheet";

/**
 * Everything this student has ordered, newest first.
 *
 * The list comes from the server now, keyed on the seating cookie, so closing
 * the tab no longer loses it — and because the server resolves by phone
 * number, it follows the student across tables and across devices once they
 * recover a session. Local storage is only a cache for the status links.
 *
 * Polling mirrors StatusClient: slow right down when the tab is hidden, and
 * stop entirely once nothing is still cooking. A forgotten tab on a student's
 * phone should not sit there draining the battery until the end of term.
 */
const POLL_VISIBLE_MS = 8000;
const POLL_HIDDEN_MS = 30000;

type Order = SubOrderView & { publicToken: string };

const isSettled = (o: Order) => o.status === "COMPLETED" || o.status === "CANCELLED";

export function MyOrdersClient() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [seated, setSeated] = useState(true);
  const [recovering, setRecovering] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/my-orders");
      if (res.status === 401) {
        setSeated(false);
        setOrders([]);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setSeated(true);
      setOrders(data.subOrders as Order[]);
    } catch {
      /* keep the last known list on a flaky connection */
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      await load();
      if (cancelled) return;
      setOrders((current) => {
        // Nothing left to watch — stop rescheduling.
        if (current && current.length > 0 && current.every(isSettled)) return current;
        const delay = document.visibilityState === "hidden" ? POLL_HIDDEN_MS : POLL_VISIBLE_MS;
        timer = setTimeout(tick, delay);
        return current;
      });
    }

    tick();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-none items-center gap-3 border-b border-border bg-bg px-4 py-3">
        <Link
          href="/order"
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-md border border-border bg-surface-raised text-text no-underline"
        >
          <Icon name="arrow-left" />
        </Link>
        <span className="t-title-md">My orders</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {orders === null ? (
          <div className="grid place-items-center py-16">
            <Spinner className="h-7 w-7 text-accent" />
          </div>
        ) : !seated ? (
          <EmptyState
            icon="qr"
            title="Scan your table code"
            body="Your orders are tied to the table you're sitting at. Scan the code on the table to see them."
            action={
              <Link href="/scan" className="no-underline">
                <Button size="sm">Scan the code</Button>
              </Link>
            }
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No orders yet"
            body="Once you order from a stall, it shows up here so you can follow it."
            action={
              <div className="grid gap-2">
                <Link href="/order" className="no-underline">
                  <Button size="sm">Browse the stalls</Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => setRecovering(true)}>
                  Ordered already? Find my order
                </Button>
              </div>
            }
          />
        ) : (
          <div className="grid gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/status/${order.publicToken}`}
                className="grid gap-2 rounded-xl border border-border bg-surface p-4 no-underline"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-semibold">{order.tokenNumber}</span>
                  <StatusChip status={order.status} />
                  <span className="t-caption ml-auto text-text-faint">{formatElapsed(order.createdAt)} ago</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="t-body-sm text-text-muted">{order.stallName}</span>
                  <span className="t-mono ml-auto text-[15px]">{formatCurrency(order.total)}</span>
                </div>
                <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} className="justify-self-start" />
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-2">
          <Link href="/order" className="no-underline">
            <Button size="hero" fullWidth>
              Order from another stall
            </Button>
          </Link>
          {seated && orders !== null && orders.length > 0 && (
            <button
              type="button"
              onClick={() => setRecovering(true)}
              className="t-body-sm py-2 text-center font-semibold text-text-muted"
            >
              Not your orders? Start fresh
            </button>
          )}
        </div>
      </div>

      <RecoverOrderSheet
        open={recovering}
        onClose={() => setRecovering(false)}
        hasOrders={(orders?.length ?? 0) > 0}
        onChanged={load}
      />
    </>
  );
}
