"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { useNewOrderAlert } from "@/lib/use-new-order-alert";
import type { SubOrderView } from "@/lib/types";
import { OrderCard } from "@/components/admin/OrderCard";
import { AwaitingPaymentCard } from "@/components/admin/AwaitingPaymentCard";
import { OrderDetailSheet } from "@/components/admin/OrderDetailSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

const POLL_MS = 5000;

export function OrderQueue() {
  const { showToast } = useToast();
  const { arm, play } = useNewOrderAlert();

  const [orders, setOrders] = useState<SubOrderView[] | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const knownIds = useRef<Set<string>>(new Set());
  const seeded = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) return;
      const data = await res.json();
      const fresh: SubOrderView[] = data.orders;

      // A brand-new order has to announce itself — sound plus a visual flash,
      // because nobody is watching the screen during a rush.
      const arrivals = fresh.filter((o) => o.status === "PLACED" && !knownIds.current.has(o.id));
      if (seeded.current && arrivals.length > 0) {
        play();
        setFlashIds((prev) => new Set([...prev, ...arrivals.map((o) => o.id)]));
        setTimeout(() => {
          setFlashIds((prev) => {
            const next = new Set(prev);
            arrivals.forEach((o) => next.delete(o.id));
            return next;
          });
        }, 6000);
      }

      fresh.forEach((o) => knownIds.current.add(o.id));
      seeded.current = true;
      setOrders(fresh);
    } catch {
      /* keep the last known board on a flaky connection */
    }
  }, [play]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  /** Optimistic update with rollback — the counter can't wait for a round trip. */
  const mutate = useCallback(
    async (subOrderId: string, optimistic: (o: SubOrderView) => SubOrderView, request: () => Promise<Response>) => {
      const snapshot = orders;
      setOrders((prev) => prev?.map((o) => (o.id === subOrderId ? optimistic(o) : o)) ?? prev);
      try {
        const res = await request();
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "That didn't go through.");
        setOrders((prev) => prev?.map((o) => (o.id === subOrderId ? data.subOrder : o)) ?? prev);
      } catch (err) {
        setOrders(snapshot ?? null);
        showToast(err instanceof Error ? err.message : "That didn't go through.", "danger");
        load();
      }
    },
    [orders, showToast, load],
  );

  const advance = useCallback(
    (order: SubOrderView) => {
      const NEXT: Record<string, SubOrderView["status"]> = {
        PLACED: "ACCEPTED",
        ACCEPTED: "PREPARING",
        PREPARING: "READY",
        READY: "COMPLETED",
      };
      const next = NEXT[order.status];
      if (!next) return;
      arm();
      return mutate(
        order.id,
        (o) => ({
          ...o,
          status: next,
          paymentStatus: next === "COMPLETED" && o.paymentMethod === "cash" ? "CONFIRMED" : o.paymentStatus,
        }),
        () => fetch(`/api/admin/orders/${order.id}/advance`, { method: "POST" }),
      );
    },
    [mutate, arm],
  );

  const setPayment = useCallback(
    (order: SubOrderView, paymentStatus: SubOrderView["paymentStatus"]) => {
      arm();
      return mutate(
        order.id,
        (o) => ({ ...o, paymentStatus }),
        () =>
          fetch(`/api/admin/orders/${order.id}/payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentStatus }),
          }),
      );
    },
    [mutate, arm],
  );

  const cancel = useCallback(
    async (order: SubOrderView, reason: string, note?: string) => {
      await mutate(
        order.id,
        (o) => ({ ...o, status: "CANCELLED" }),
        () =>
          fetch(`/api/admin/orders/${order.id}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason, note }),
          }),
      );
      setDetailId(null);
    },
    [mutate],
  );

  const groups = useMemo(() => {
    const all = orders ?? [];
    return {
      // Unverified UPI claims sit apart from the cooking queue on purpose:
      // staff must not start cooking against a payment nobody has seen land.
      awaitingPayment: all.filter(
        (o) =>
          o.paymentMethod === "upi" &&
          o.paymentStatus === "AWAITING_CONFIRMATION" &&
          o.status !== "CANCELLED" &&
          o.status !== "COMPLETED",
      ),
      unpaidUpi: all.filter(
        (o) =>
          o.paymentMethod === "upi" &&
          o.paymentStatus === "PENDING" &&
          o.status === "PLACED",
      ),
      fresh: all.filter(
        (o) =>
          o.status === "PLACED" &&
          !(o.paymentMethod === "upi" && o.paymentStatus !== "CONFIRMED"),
      ),
      accepted: all.filter((o) => o.status === "ACCEPTED"),
      preparing: all.filter((o) => o.status === "PREPARING"),
      ready: all.filter((o) => o.status === "READY"),
      problems: all.filter((o) => o.paymentStatus === "FAILED" || o.paymentStatus === "REFUND_DUE"),
    };
  }, [orders]);

  const detailOrder = orders?.find((o) => o.id === detailId) ?? null;

  if (orders === null) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }

  const nothingLive =
    groups.awaitingPayment.length === 0 &&
    groups.fresh.length === 0 &&
    groups.accepted.length === 0 &&
    groups.preparing.length === 0 &&
    groups.ready.length === 0;

  return (
    <div className="grid gap-6 px-4 py-5">
      {groups.problems.length > 0 && (
        <Section title="Needs attention" tone="danger" count={groups.problems.length}>
          {groups.problems.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              flash={false}
              onOpen={() => setDetailId(order.id)}
              onAdvance={() => advance(order)}
              onMarkRefunded={() => setPayment(order, "REFUNDED")}
            />
          ))}
        </Section>
      )}

      {groups.awaitingPayment.length > 0 && (
        <Section title="Awaiting payment" tone="warning" count={groups.awaitingPayment.length}>
          {groups.awaitingPayment.map((order) => (
            <AwaitingPaymentCard
              key={order.id}
              order={order}
              onConfirm={() => setPayment(order, "CONFIRMED")}
              onReject={() => setPayment(order, "FAILED")}
              onOpen={() => setDetailId(order.id)}
            />
          ))}
        </Section>
      )}

      {groups.unpaidUpi.length > 0 && (
        <Section title="UPI — not paid yet" count={groups.unpaidUpi.length}>
          {groups.unpaidUpi.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              flash={flashIds.has(order.id)}
              onOpen={() => setDetailId(order.id)}
              onAdvance={() => advance(order)}
            />
          ))}
        </Section>
      )}

      <Section title="New" tone="new" count={groups.fresh.length}>
        {groups.fresh.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            flash={flashIds.has(order.id)}
            onOpen={() => setDetailId(order.id)}
            onAdvance={() => advance(order)}
          />
        ))}
      </Section>

      {groups.accepted.length > 0 && (
        <Section title="Accepted" count={groups.accepted.length}>
          {groups.accepted.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              flash={false}
              onOpen={() => setDetailId(order.id)}
              onAdvance={() => advance(order)}
            />
          ))}
        </Section>
      )}

      <Section title="Preparing" count={groups.preparing.length}>
        {groups.preparing.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            flash={false}
            onOpen={() => setDetailId(order.id)}
            onAdvance={() => advance(order)}
          />
        ))}
      </Section>

      <Section title="Ready — call the token" tone="ready" count={groups.ready.length}>
        {groups.ready.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            flash={false}
            onOpen={() => setDetailId(order.id)}
            onAdvance={() => advance(order)}
          />
        ))}
      </Section>

      {nothingLive && (
        <EmptyState
          glyph="✓"
          title="Nothing waiting"
          body="New orders land here on their own, with a sound. You don't need to refresh."
        />
      )}

      <OrderDetailSheet
        order={detailOrder}
        onClose={() => setDetailId(null)}
        onAdvance={() => detailOrder && advance(detailOrder)}
        onCancel={(reason, note) => detailOrder && cancel(detailOrder, reason, note)}
        onConfirmPayment={() => detailOrder && setPayment(detailOrder, "CONFIRMED")}
        onMarkRefunded={() => detailOrder && setPayment(detailOrder, "REFUNDED")}
      />
    </div>
  );
}

function Section({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone?: "new" | "warning" | "ready" | "danger";
  children: React.ReactNode;
}) {
  if (count === 0 && tone !== "new") return null;

  return (
    <section className="grid gap-3">
      <h2 className="flex items-center gap-2">
        <span className="t-title-md">{title}</span>
        <span
          className={cn(
            "inline-flex h-6 min-w-6 items-center justify-center rounded-pill px-2 text-xs font-bold",
            tone === "new" && "bg-status-new-bg text-status-new-ink",
            tone === "warning" && "bg-status-preparing-bg text-status-preparing-ink",
            tone === "ready" && "bg-status-ready-bg text-status-ready-ink",
            tone === "danger" && "bg-danger-bg text-danger",
            !tone && "bg-surface-raised text-text-muted",
          )}
        >
          {count}
        </span>
      </h2>
      {count === 0 ? (
        <p className="t-body-sm text-text-muted">Nothing new right now.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-start gap-3">{children}</div>
      )}
    </section>
  );
}
