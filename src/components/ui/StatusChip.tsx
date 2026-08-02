import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/lib/types";

const STATUS_META: Record<OrderStatus, { label: string; glyph: string; bg: string; ink: string }> = {
  received: { label: "New", glyph: "●", bg: "var(--status-new-bg)", ink: "var(--status-new-ink)" },
  preparing: { label: "Preparing", glyph: "▲", bg: "var(--status-preparing-bg)", ink: "var(--status-preparing-ink)" },
  served: { label: "Served", glyph: "✓", bg: "var(--status-served-bg)", ink: "var(--status-served-ink)" },
  cancelled: { label: "Cancelled", glyph: "✕", bg: "var(--status-cancelled-bg)", ink: "var(--status-cancelled-ink)" },
};

export function StatusChip({
  status,
  size = "md",
  className,
}: {
  status: OrderStatus;
  size?: "md" | "lg";
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill font-semibold",
        size === "lg" ? "h-9 px-4 text-sm" : "h-7 px-3 text-xs",
        status === "received" && "animate-rt-ring",
        className,
      )}
      style={{ background: meta.bg, color: meta.ink }}
    >
      <span aria-hidden="true">{meta.glyph}</span>
      {meta.label}
    </span>
  );
}
