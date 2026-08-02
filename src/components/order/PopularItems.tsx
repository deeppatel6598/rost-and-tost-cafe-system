"use client";

import { formatCurrency } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { VegMark } from "@/components/ui/VegMark";

export function PopularItems({ items, onOpen }: { items: MenuItem[]; onOpen: (id: string) => void }) {
  if (items.length === 0) return null;

  return (
    <section className="grid gap-3">
      <div className="flex items-baseline gap-2 px-[var(--gutter-guest)]">
        <h2 className="t-title-lg">Popular right now</h2>
        <span className="t-caption text-text-faint">What most tables order</span>
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter-guest)] pb-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item.id)}
            className="flex w-[168px] shrink-0 snap-start flex-col gap-2 rounded-xl border border-border bg-surface p-2 text-left"
          >
            <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg">
              <PlaceholderImage photoUrl={item.photoUrl} itemId={item.id} categoryId={item.categoryId} alt={item.name} />
              {item.badge && (
                <span className="absolute left-1.5 top-1.5 rounded-pill bg-roast-950/80 px-2 py-0.5 text-[10px] font-semibold text-coral-300">
                  {item.badge}
                </span>
              )}
            </span>
            <span className="grid gap-1 px-0.5 pb-0.5">
              <span className="flex items-center gap-1.5">
                <VegMark type={item.veg} size={14} />
                <span className="t-title-sm truncate">{item.name}</span>
              </span>
              <span className="t-mono text-[14px]">{formatCurrency(item.price)}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
