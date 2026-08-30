import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { TodayStats } from "@/lib/store/orders";
import type { StallAvailability, SubOrderView } from "@/lib/types";
import { PaymentBadge } from "@/components/ui/StatusChip";

interface StallSummary {
  id: string;
  name: string;
  availability: StallAvailability;
  stats: TodayStats;
}

/**
 * Read-mostly oversight across all four stalls. Deliberately has no menu or
 * price editing: the supervisor runs the canteen, but each stall's menu and
 * prices belong to that business.
 */
export function SuperAdminView({
  canteen,
  problems,
  stalls,
}: {
  canteen: TodayStats;
  problems: SubOrderView[];
  stalls: StallSummary[];
}) {
  const busiest = Math.max(1, ...canteen.hourly.map((h) => h.count));
  const openCount = stalls.filter((s) => s.availability.canOrder).length;

  return (
    <div className="grid gap-6 px-4 py-5">
      <div>
        <span className="t-display-sm block">Canteen today</span>
        <span className="t-body-sm text-text-muted">
          {openCount} of {stalls.length} stalls open
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total sales" value={formatCurrency(canteen.grossSales)} emphasis />
        <Stat label="Orders" value={String(canteen.orderCount)} />
        <Stat label="Cash" value={formatCurrency(canteen.cashSales)} />
        <Stat label="UPI" value={formatCurrency(canteen.upiSales)} />
      </div>

      <section className="grid gap-3">
        <h2 className="t-title-md">By stall</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
          {stalls.map((stall) => (
            <div key={stall.id} className="grid gap-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <span className="t-title-sm">{stall.name}</span>
                <span
                  className={cn(
                    "ml-auto inline-flex h-6 items-center rounded-pill px-2.5 text-[11px] font-semibold",
                    stall.availability.canOrder
                      ? "bg-status-served-bg text-status-served-ink"
                      : "bg-status-cancelled-bg text-status-cancelled-ink",
                  )}
                >
                  {stall.availability.canOrder ? "Open" : "Closed"}
                </span>
              </div>
              <span className="font-mono text-2xl font-bold">{formatCurrency(stall.stats.grossSales)}</span>
              <span className="t-body-sm text-text-muted">
                {stall.stats.orderCount} orders · {stall.stats.completedCount} collected
                {stall.stats.cancelledCount > 0 && ` · ${stall.stats.cancelledCount} cancelled`}
              </span>
              <span className="t-caption text-text-faint">
                Cash {formatCurrency(stall.stats.cashSales)} · UPI {formatCurrency(stall.stats.upiSales)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-2 rounded-xl border border-border bg-surface p-4">
        <h2 className="t-title-md">Peak hours</h2>
        <div className="flex h-28 items-end gap-0.5" aria-hidden="true">
          {canteen.hourly.slice(7, 23).map((h) => (
            <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-accent"
                style={{ height: `${Math.max(2, (h.count / busiest) * 84)}px` }}
              />
              <span className="text-[9px] text-text-faint">{h.hour}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-2">
        <h2 className="t-title-md">
          Problem orders{problems.length > 0 && <span className="text-danger"> · {problems.length}</span>}
        </h2>
        {problems.length === 0 ? (
          <p className="t-body-sm text-text-muted">
            No failed payments or refunds owed anywhere in the canteen.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {problems.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <span className="t-mono font-bold">{order.tokenNumber}</span>
                <span className="t-body-sm">{order.stallName}</span>
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
