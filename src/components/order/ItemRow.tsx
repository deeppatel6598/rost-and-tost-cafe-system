"use client";

import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { CategoryIcon, MenuItem } from "@/lib/types";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { VegMark } from "@/components/ui/VegMark";
import { Button } from "@/components/ui/Button";

export function ItemRow({
  item,
  categoryIcon,
  quickQty,
  onOpen,
  onQuickAdd,
}: {
  item: MenuItem;
  categoryIcon: CategoryIcon;
  quickQty: number;
  onOpen: () => void;
  onQuickAdd: () => void;
}) {
  const soldOut = !item.available;
  const needsOptions = item.optionGroups.length > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border py-4 last:border-b-0",
        soldOut && "opacity-55",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${item.name}${soldOut ? ", sold out" : ""}`}
        className="relative aspect-square w-[76px] shrink-0 overflow-hidden rounded-lg"
      >
        <PlaceholderImage photoUrl={item.photoUrl} icon={categoryIcon} alt={item.name} />
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-roast-950/85 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-on-dark-soft">
            Sold out
          </span>
        )}
      </button>

      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="mb-1 flex items-center gap-2">
          <VegMark type={item.veg} />
          <span className="t-title-sm truncate">{item.name}</span>
          {item.badge && !soldOut && (
            <span className="rounded-pill bg-accent-tint px-2 py-0.5 text-[11px] font-semibold text-accent">
              {item.badge}
            </span>
          )}
        </span>
        <span className="t-body-sm block truncate text-text-muted">{item.description}</span>
        <span className="t-mono mt-1 block text-[15px] text-text">{formatCurrency(item.price)}</span>
      </button>

      <div className="shrink-0">
        {soldOut ? (
          <span className="t-caption text-text-faint">Unavailable</span>
        ) : quickQty > 0 && !needsOptions ? (
          <span className="flex h-9 items-center rounded-md bg-accent-tint px-3 text-sm font-semibold text-accent">
            {quickQty} in order
          </span>
        ) : (
          <Button size="sm" variant="secondary" onClick={needsOptions ? onOpen : onQuickAdd} aria-label={`Add ${item.name}`}>
            Add
          </Button>
        )}
      </div>
    </div>
  );
}
