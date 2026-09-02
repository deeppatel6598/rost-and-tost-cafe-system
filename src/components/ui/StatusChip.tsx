import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { PaymentMethod, PaymentStatus, SubOrderStatus } from "@/lib/types";

/**
 * Status is never signalled by colour alone — each state also has its own
 * glyph and its own wording, so it survives a colour-blind reader and a
 * washed-out phone screen in daylight.
 */
const STATUS_META: Record<SubOrderStatus, { label: string; icon: IconName; bg: string; ink: string }> = {
  PLACED: { label: "New", icon: "dot", bg: "var(--status-new-bg)", ink: "var(--status-new-ink)" },
  ACCEPTED: { label: "Accepted", icon: "check", bg: "var(--status-accepted-bg)", ink: "var(--status-accepted-ink)" },
  PREPARING: { label: "Preparing", icon: "flame", bg: "var(--status-preparing-bg)", ink: "var(--status-preparing-ink)" },
  READY: { label: "Ready", icon: "bell", bg: "var(--status-ready-bg)", ink: "var(--status-ready-ink)" },
  COMPLETED: { label: "Collected", icon: "check-circle", bg: "var(--status-served-bg)", ink: "var(--status-served-ink)" },
  CANCELLED: { label: "Cancelled", icon: "x-circle", bg: "var(--status-cancelled-bg)", ink: "var(--status-cancelled-ink)" },
};

export function StatusChip({
  status,
  size = "md",
  className,
}: {
  status: SubOrderStatus;
  size?: "md" | "lg";
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill font-semibold",
        size === "lg" ? "h-9 px-4 text-sm" : "h-7 px-3 text-xs",
        className,
      )}
      style={{ background: meta.bg, color: meta.ink }}
    >
      <Icon name={meta.icon} size={size === "lg" ? 17 : 14} strokeWidth={2} />
      {meta.label}
    </span>
  );
}

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Unpaid",
  AWAITING_CONFIRMATION: "Claims paid",
  CONFIRMED: "Paid",
  FAILED: "Payment failed",
  REFUND_DUE: "Refund due",
  REFUNDED: "Refunded",
};

/**
 * Payment state, always shown next to the method. Staff need "UPI · Paid"
 * versus "UPI · claims paid" to be unmistakable — the second one means
 * nobody has actually seen the money yet.
 */
export function PaymentBadge({
  method,
  status,
  className,
}: {
  method: PaymentMethod;
  status: PaymentStatus;
  className?: string;
}) {
  const confirmed = status === "CONFIRMED";
  const problem = status === "FAILED" || status === "REFUND_DUE";
  const claimed = status === "AWAITING_CONFIRMATION";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold",
        confirmed && "border-status-served bg-status-served-bg text-status-served-ink",
        claimed && "border-status-preparing bg-status-preparing-bg text-status-preparing-ink",
        problem && "border-danger bg-danger-bg text-danger",
        !confirmed && !problem && !claimed && "border-border bg-surface-raised text-text-muted",
        className,
      )}
    >
      <Icon name={method === "cash" ? "cash" : "qr"} size={14} strokeWidth={2} />
      {method === "cash" ? "Cash" : "UPI"} · {PAYMENT_LABEL[status]}
    </span>
  );
}
