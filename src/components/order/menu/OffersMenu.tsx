"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { AddButton, ItemArt, NameWithMark, Price, SoldOutVeil, groupByCategory, type MenuLayoutProps } from "./shared";

/**
 * La Pinos — offer-led layout.
 *
 * A pizza counter sells on deals and on the picture of the food, so this menu
 * leads with an offer strip and a rail of picks, then drops into a two-column
 * card grid filtered by a chip row. The photo does the work on each card and
 * the add button sits on the card itself, so a student re-ordering something
 * they already know can add it without opening anything.
 */
export function OffersMenu({ stall, categories, items, onOpenItem, onQuickAdd }: MenuLayoutProps) {
  const groups = useMemo(() => groupByCategory(categories, items), [categories, items]);
  const [filterId, setFilterId] = useState<string>("all");

  // The rail is the shop window: the priciest few available items, which for a
  // pizza menu are the ones worth a photo.
  const picks = useMemo(
    () =>
      items
        .filter((i) => i.isAvailable)
        .slice()
        .sort((a, b) => b.basePrice - a.basePrice)
        .slice(0, 5),
    [items],
  );

  const visible = filterId === "all" ? groups : groups.filter((g) => g.category.id === filterId);
  const hero = picks[0] ?? items[0];
  const cheapest = items.length > 0 ? Math.min(...items.map((i) => i.basePrice)) : null;

  return (
    <div className="flex-1 overflow-y-auto bg-surface-sunken pb-[132px]">
      {/* Offer strip. Nothing here is a coupon code — combos are priced on the
          menu itself, so this only points at what is already there. */}
      <div className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-card u-brand-grad p-4 u-lift-2">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand-ink/75">Today at the counter</p>
          <p className="t-title-md mt-1 max-w-[76%] leading-snug text-brand-ink">{stall.tagline}</p>
          <p className="t-body-sm mt-1 text-brand-ink/75">Baked to order · pay at this stall</p>
          {hero && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-6 -right-5 h-[112px] w-[112px] rotate-[-10deg] drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
            >
              <ItemArt item={hero} rounded="rounded-3xl" bare />
            </span>
          )}
        </div>
      </div>

      {picks.length > 0 && (
        <section className="pt-5">
          <div className="mb-3 flex items-baseline justify-between px-4">
            <h2 className="t-title-sm">Special picks</h2>
            <span className="t-caption text-text-faint">{picks.length} items</span>
          </div>

          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
            {picks.map((item) => (
              <article
                key={item.id}
                className="w-[168px] shrink-0 overflow-hidden rounded-card bg-surface u-lift-2"
              >
                <button
                  type="button"
                  onClick={() => onOpenItem(item.id)}
                  aria-label={`View ${item.name}`}
                  className="relative block h-[124px] w-full u-photo-plate"
                >
                  <ItemArt item={item} rounded="rounded-none" />
                  {!item.isAvailable && <SoldOutVeil rounded="rounded-none" />}
                </button>
                <div className="p-3">
                  <NameWithMark item={item} className="t-title-sm min-h-[2.6em]" markSize={12} wrap />
                  <p className="t-caption mt-0.5 line-clamp-1 text-text-muted">{item.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Price value={item.basePrice} className="text-[16px]" />
                    <AddButton item={item} onQuickAdd={() => onQuickAdd(item)} tone="brand" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Chip filter rather than scroll-spy: this menu is short enough that
          swapping the grid is quicker than scrolling to a section. */}
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto px-4">
        <FilterChip label="All" active={filterId === "all"} onClick={() => setFilterId("all")} />
        {groups.map(({ category }) => (
          <FilterChip
            key={category.id}
            label={category.name}
            active={filterId === category.id}
            onClick={() => setFilterId(category.id)}
          />
        ))}
      </div>

      {visible.map(({ category, items: categoryItems }) => (
        <section key={category.id} className="px-4 pt-5">
          <h3 className="t-overline mb-3 text-text-faint">{category.name}</h3>
          <div className="grid grid-cols-2 gap-3">
            {categoryItems.map((item) => (
              <article
                key={item.id}
                className={cn(
                  "relative overflow-hidden rounded-card bg-surface u-lift-1",
                  !item.isAvailable && "opacity-70",
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpenItem(item.id)}
                  aria-label={`View ${item.name}`}
                  className="relative block h-[112px] w-full u-photo-plate"
                >
                  <ItemArt item={item} rounded="rounded-none" />
                  {!item.isAvailable && <SoldOutVeil rounded="rounded-none" />}
                </button>

                <div className="p-3 pb-3.5">
                  <NameWithMark item={item} className="t-title-sm min-h-[2.6em]" markSize={12} wrap />
                  <p className="t-caption mt-0.5 line-clamp-2 min-h-[2.2em] text-text-muted">{item.description}</p>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <Price value={item.basePrice} className="text-[15px]" />
                    <AddButton item={item} onQuickAdd={() => onQuickAdd(item)} tone="brand" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <p className="t-caption mt-6 px-4 text-center text-text-faint">
        {items.length} items{cheapest !== null && <> · from {formatCurrency(cheapest)}</>}
      </p>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-11 shrink-0 whitespace-nowrap rounded-pill px-5 text-sm font-semibold transition-colors",
        active ? "u-brand-grad text-brand-ink" : "bg-surface text-text-muted u-lift-1",
      )}
    >
      {label}
    </button>
  );
}
