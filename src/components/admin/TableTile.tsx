import { cn } from "@/lib/cn";
import { formatElapsed } from "@/lib/format";
import type { Order } from "@/lib/types";

export function TableTile({ number, openOrder }: { number: number; openOrder: Order | null }) {
  const status = openOrder?.status === "received" ? "new" : openOrder?.status === "preparing" ? "preparing" : "free";

  const border =
    status === "new" ? "border-status-new" : status === "preparing" ? "border-status-preparing" : "border-border";
  const fg =
    status === "new" ? "text-status-new-ink" : status === "preparing" ? "text-status-preparing-ink" : "text-text-muted";
  const label = status === "new" ? "New order" : status === "preparing" ? "Preparing" : "Free";

  return (
    <div className={cn("grid min-h-[130px] content-start gap-2 rounded-lg border bg-surface p-4", border)}>
      <span className="t-mono text-3xl font-medium">{String(number).padStart(2, "0")}</span>
      <span className={cn("t-body-sm font-medium", fg)}>{label}</span>
      <span className="t-mono text-xs text-text-faint">{openOrder ? formatElapsed(openOrder.placedAt) : "no open order"}</span>
      <a
        href={`/api/tables/qr/${number}`}
        download={`table-${number}-qr.png`}
        className="t-caption mt-1 text-accent no-underline hover:underline"
      >
        Download QR
      </a>
    </div>
  );
}
