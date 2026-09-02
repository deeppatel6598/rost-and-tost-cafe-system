"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export function QuantityStepper({
  value,
  min = 0,
  max = 20,
  onChange,
  size = "guest",
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  size?: "guest" | "admin";
  className?: string;
}) {
  const dim = size === "guest" ? "h-11" : "h-14";
  const btnDim = size === "guest" ? "w-11 h-11 text-lg" : "w-14 h-14 text-xl";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-between rounded-md border border-border-strong bg-surface-raised",
        dim,
        className,
      )}
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        aria-label={value <= min + 1 ? "Remove item" : "Decrease quantity"}
        className={cn("flex items-center justify-center font-semibold text-text hover:text-accent", btnDim)}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Icon name={value <= min + 1 ? "trash" : "minus"} size={18} strokeWidth={2} />
      </button>
      <span className="t-mono min-w-[1.5em] text-center" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={cn("flex items-center justify-center font-semibold text-text hover:text-accent", btnDim)}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}
