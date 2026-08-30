import { formatCurrency } from "@/lib/format";
import type { TodayStats } from "@/lib/store/orders";
import type { SubOrderView } from "@/lib/types";
import { PaymentBadge } from "@/components/ui/StatusChip";

/**
 * What a stall owner opens the app to check. Sales count only money actually
 * confirmed — an unpaid or cancelled order is not takings, and an owner
 * reconciling against their UPI app at closing time would spot it if it were.
 */
export function TodayView({
  title,
  stats,
  problems,
}: {
  title: string;
  stats: TodayStats;
  problems: SubOrderView[];
}) {
  const peak = stats.hourly.reduce((max, h) => (h.count > max.count ? h : max), stats.hourly[0]);
  const busiest = Math.max(1, ...stats.hourly.map((h) => h.count));

  return (
    <div className="grid gap-6 px-4 py-5">
      <div>
        <span className="t-display-sm block">Today</span>
        <span className="t-body-sm text-text-muted">{title}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Confirmed sales" value={formatCurrency(stats.grossSales)} emphasis />
        <Stat label="Orders" value={String(stats.orderCount)} />
        <Stat label="Cash" value={formatCurrency(stats.cashSales)} />
        <Stat label="UPI" value={formatCurrency(stats.upiSales)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="grid gap-2 rounded-xl border border-border bg-surface p-4">
          <h2 className="t-title-md">Top items</h2>
          {stats.topItems.length === 0 ? (
            <p className="t-body-sm text-text-muted">Nothing sold yet today.</p>
          ) : (
            stats.topItems.map((item) => (
              <div key={item.name} className="flex items-center gap-3 border-b border-border py-1.5 last:border-b-0">
                <span className="t-mono w-8 shrink-0 font-semibold">{item.quantity}×</span>
                <span className="min-w-0 flex-1 truncate text-[15px]">{item.name}</span>
                <span className="t-mono text-text-muted">{formatCurrency(item.revenue)}</span>
              </div>
            ))
          )}
        </section>

        <section className="grid gap-2 rounded-xl border border-border bg-surface p-4">
          <h2 className="t-title-md">By hour</h2>
          <p className="t-body-sm text-text-muted">
            {peak && peak.count > 0 ? `Busiest around ${peak.hour}:00` : "No orders yet today."}
          </p>
          <div className="flex h-24 items-end gap-0.5" aria-hidden="true">
            {stats.hourly.slice(7, 23).map((h) => (
              <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-accent"
                  style={{ height: `${Math.max(2, (h.count / busiest) * 72)}px` }}
                />
                <span className="text-[9px] text-text-faint">{h.hour}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="grid gap-2">
        <h2 className="t-title-md">
          Needs attention{problems.length > 0 && <span className="text-danger"> · {problems.length}</span>}
        </h2>
        {problems.length === 0 ? (
          <p className="t-body-sm text-text-muted">No failed payments or refunds owed. </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {problems.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <span className="t-mono font-bold">{order.tokenNumber}</span>
                <span className="t-body-sm text-text-muted">Table {order.tableNumber}</span>
                <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
                <span className="t-mono ml-auto">{formatCurrency(order.total)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="grid gap-1 rounded-xl border border-border bg-surface p-4">
      <span className="t-overline text-text-faint">{label}</span>
      <span className={emphasis ? "font-mono text-2xl font-bold" : "font-mono text-xl font-semibold"}>{value}</span>
    </div>
  );
}
