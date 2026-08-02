"use client";

import { cn } from "@/lib/cn";

export function ToggleSwitch({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-9 w-16 shrink-0 items-center rounded-pill transition-colors duration-base",
        checked ? "bg-status-served" : "bg-border-strong",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-7 w-7 transform rounded-full bg-white shadow-1 transition-transform duration-base",
          checked ? "translate-x-8" : "translate-x-1",
        )}
      />
    </button>
  );
}
