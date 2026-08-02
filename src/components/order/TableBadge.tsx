export function TableBadge({ tableNumber }: { tableNumber: number }) {
  return (
    <span className="inline-flex h-8 items-center rounded-pill border border-accent bg-accent-tint px-3 font-mono text-[13px] font-semibold text-accent">
      Table&nbsp;{tableNumber}
    </span>
  );
}
