"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatElapsed } from "@/lib/format";
import { listRememberedTokens } from "@/lib/my-orders";
import type { SubOrderView } from "@/lib/types";
import { StatusChip, PaymentBadge } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Every order this browser has placed, newest first. There are no guest
 * accounts, so this is rebuilt from the tokens kept in local storage.
 */
export function MyOrdersClient() {
  const [orders, setOrders] = useState<(SubOrderView & { publicToken: string })[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const tokens = listRememberedTokens();
      if (tokens.length === 0) {
        if (!cancelled) setOrders([]);
        return;
      }

      const results = await Promise.all(
        tokens.map(async (token) => {
          try {
            const res = await fetch(`/api/orders/${token}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.subOrders as (SubOrderView & { publicToken: string })[];
          } catch {
            return [];
          }
        }),
      );

      if (cancelled) return;
      const flat = results.flat().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setOrders(flat);
    }

    load();
    const poll = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-none items-center gap-3 border-b border-border bg-bg px-4 py-3">
        <Link
          href="/order"
          aria-label="Back"
          className="grid h-10 w-10 place-items-center rounded-md border border-border bg-surface-raised text-text no-underline"
        >
          ←
        </Link>
        <span className="t-title-md">My orders</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {orders === null ? (
          <div className="grid place-items-center py-16">
            <Spinner className="h-7 w-7 text-accent" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            glyph="▤"
            title="No orders yet"
            body="Once you order from a stall, it shows up here so you can follow it."
            action={
              <Link href="/order" className="no-underline">
                <Button size="sm">Browse the stalls</Button>
              </Link>
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

        <div className="mt-6">
          <Link href="/order" className="no-underline">
            <Button size="hero" fullWidth>
              Order from another stall
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
