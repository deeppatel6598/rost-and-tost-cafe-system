"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The table number is shown on every guest screen, prominently, so a student
 * can check it against the number printed on the table they're sitting at.
 * Food arriving at the wrong table is the failure this is guarding against.
 */
export function GuestHeader({
  tableNumber,
  title,
  backHref,
  onBack,
  right,
}: {
  tableNumber: number;
  title?: string;
  backHref?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const backButtonClasses =
    "grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface-raised text-text";

  return (
    <header className="sticky top-0 z-30 flex flex-none items-center gap-3 border-b border-border bg-bg px-4 py-3">
      {onBack ? (
        <button type="button" aria-label="Go back" onClick={onBack} className={backButtonClasses}>
          ←
        </button>
      ) : backHref ? (
        <Link href={backHref} aria-label="Go back" className={cn(backButtonClasses, "no-underline")}>
          ←
        </Link>
      ) : null}

      <span className="inline-flex h-8 shrink-0 items-center rounded-pill border border-accent bg-accent-tint px-3 font-mono text-[13px] font-semibold text-accent">
        Table {tableNumber}
      </span>

      {title && <span className="t-title-sm truncate">{title}</span>}

      <div className="ml-auto flex shrink-0 items-center gap-2">{right}</div>
    </header>
  );
}
