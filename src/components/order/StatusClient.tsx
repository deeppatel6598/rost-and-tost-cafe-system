"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatCurrency, formatElapsed } from "@/lib/format";
import { CANCEL_WINDOW_MS } from "@/lib/order-constants";
import type { SubOrderStatus, SubOrderView } from "@/lib/types";
import { GuestHeader } from "@/components/order/GuestHeader";
import { UpiPanel } from "@/components/order/UpiPanel";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

type StatusOrder = SubOrderView & { upiLink: string | null; upiVpa: string | null };

const STEPS: { status: SubOrderStatus; label: string }[] = [
  { status: "PLACED", label: "Sent" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "PREPARING", label: "Cooking" },
  { status: "READY", label: "Ready" },
  { status: "COMPLETED", label: "Collected" },
];

const HEADLINE: Record<SubOrderStatus, [string, string]> = {
  PLACED: ["Sent to the stall", "They'll accept it in a moment."],
  ACCEPTED: ["The stall has your order", "It goes on the stove shortly."],
  PREPARING: ["Being cooked now", "We'll call your token when it's ready."],
  READY: ["Ready — collect it now", "Your token is being called at the counter."],
  COMPLETED: ["Collected", "Enjoy. Order again whenever you like."],
  CANCELLED: ["This order was cancelled", "Speak to the stall if you need help."],
};

/** Poll fast while the student is looking, slowly when the tab is hidden. */
const POLL_VISIBLE_MS = 5000;
const POLL_HIDDEN_MS = 20000;

export function StatusClient({ publicToken }: { publicToken: string }) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<StatusOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${publicToken}`);
      if (res.status === 404) {
        setError("We couldn't find that order.");
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setOrders(data.subOrders);
      setError(null);
    } catch {
      /* transient — keep showing the last known state */
    }
  }, [publicToken]);

  // Polling loop that backs off when hidden and stops once everything is in a
  // terminal state, so a forgotten tab doesn't hammer the server all evening.
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await load();
      if (cancelled) return;

      setOrders((current) => {
        const allDone =
          current !== null &&
          current.length > 0 &&
          current.every((o) => o.status === "COMPLETED" || o.status === "CANCELLED");
        if (!allDone) {
          const delay = document.visibilityState === "visible" ? POLL_VISIBLE_MS : POLL_HIDDEN_MS;
          timerRef.current = setTimeout(tick, delay);
        }
        return current;
      });
    };

    tick();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (timerRef.current) clearTimeout(timerRef.current);
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  // Drives the cancel-window countdown.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  async function cancelOrder(subOrderId: string) {
    setBusyId(subOrderId);
    try {
      const res = await fetch(`/api/orders/${publicToken}/${subOrderId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Order cancelled", "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not cancel.", "danger");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="t-title-md">{error}</span>
        <Link href="/order" className="t-body-sm">
          Back to the stalls
        </Link>
      </div>
    );
  }

  if (orders === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }

  const tableNumber = orders[0]?.tableNumber ?? 0;

  return (
    <>
      <GuestHeader
        tableNumber={tableNumber}
        title="Your order"
        right={
          <Link
            href="/orders"
            className="flex h-9 items-center rounded-pill border border-border bg-surface-raised px-3 text-[13px] font-semibold text-text no-underline"
          >
            All orders
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <div className="grid gap-5">
          {orders.map((order) => {
            const cancellableUntil = new Date(order.createdAt).getTime() + CANCEL_WINDOW_MS;
            const secondsLeft = Math.max(0, Math.ceil((cancellableUntil - now) / 1000));
            const canCancel = order.status === "PLACED" && secondsLeft > 0;
            const [headline, body] = HEADLINE[order.status];
            const needsPayment = order.paymentMethod === "upi" && order.paymentStatus !== "CONFIRMED";

            return (
              <article key={order.id} className="grid gap-4 rounded-2xl border border-border bg-surface p-5">
                {/* The token number is the largest thing on the screen — it is
                    what gets called out across a loud canteen. */}
                <div className="text-center">
                  <span className="t-overline block text-text-faint">{order.stallName}</span>
                  <span className="font-mono text-5xl font-semibold tracking-tight">{order.tokenNumber}</span>
                  <span className="t-body-sm mt-1 block text-text-muted">
                    Table {order.tableNumber} · placed {formatElapsed(order.createdAt, now)} ago
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <StatusChip status={order.status} size="lg" />
                </div>

                {order.status !== "CANCELLED" && <Timeline status={order.status} />}

                <div className="text-center">
                  <span className="t-title-md block">{headline}</span>
                  <span className="t-body-sm text-text-muted">{body}</span>
                </div>

                {order.status === "CANCELLED" && order.cancelReason && (
                  <p className="t-body-sm rounded-md bg-status-cancelled-bg px-3 py-2 text-center text-status-cancelled-ink">
                    {order.cancelReason}
                  </p>
                )}

                {needsPayment && order.status !== "CANCELLED" && (
                  <UpiPanel
                    publicToken={publicToken}
                    order={order}
                    onUpdated={load}
                  />
                )}

                {order.paymentMethod === "cash" && order.paymentStatus !== "CONFIRMED" && (
                  <p className="t-body-sm rounded-md bg-surface-raised px-3 py-2.5 text-center text-text-body">
                    Pay {formatCurrency(order.total)} in cash at the {order.stallName} counter when you collect.
                  </p>
                )}

                <div className="grid gap-1.5 rounded-lg border border-border bg-surface-sunken px-4 py-3">
                  {order.items.map((line) => (
                    <div key={line.id} className="flex gap-3 text-[15px] text-text-body">
                      <span className="t-mono text-text-muted">{line.quantity}×</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{line.itemNameSnapshot}</span>
                        {(line.variantNameSnapshot || line.addonsSnapshot.length > 0) && (
                          <span className="block truncate text-xs text-text-faint">
                            {[line.variantNameSnapshot, ...line.addonsSnapshot.map((a) => a.name)]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        )}
                      </span>
                      <span className="t-mono">{formatCurrency(line.lineTotal)}</span>
                    </div>
                  ))}
                  {order.specialInstructions && (
                    <p className="t-body-sm italic text-text-faint">“{order.specialInstructions}”</p>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 font-semibold">
                    <span>Total</span>
                    <span className="t-mono">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {canCancel ? (
                  <Button
                    variant="secondary"
                    size="guest"
                    fullWidth
                    disabled={busyId === order.id}
                    onClick={() => cancelOrder(order.id)}
                  >
                    {busyId === order.id ? <Spinner /> : `Cancel order (${secondsLeft}s left)`}
                  </Button>
                ) : order.status !== "COMPLETED" && order.status !== "CANCELLED" ? (
                  <p className="t-caption text-center text-text-faint">
                    The stall has this order now — ask staff for help if something is wrong.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="mt-6 grid gap-2">
          <Link href="/order" className="no-underline">
            <Button size="hero" fullWidth>
              Order from another stall
            </Button>
          </Link>
          <Link href="/orders" className="no-underline">
            <Button variant="ghost" size="guest" fullWidth>
              View all my orders
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}

function Timeline({ status }: { status: SubOrderStatus }) {
  const currentIndex = STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="flex items-center gap-1" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <li key={step.status} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-full rounded-pill",
                done ? "bg-accent" : "bg-border-strong",
              )}
            />
            <span className={cn("text-[10px]", done ? "font-semibold text-text" : "text-text-faint")}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
