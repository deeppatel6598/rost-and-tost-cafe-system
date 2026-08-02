"use client";

import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

/**
 * Horizontal category browser on the menu landing screen. Deliberately a
 * plain scroll-snap rail rather than the old 3-up transform carousel: the
 * carousel positioned its cards with large z-indexes that fought with the
 * item sheet, and it sat on top of the item list, which is exactly the
 * layering mess this replaces. Tapping a category drills into its items.
 */
export function CategoryRail({
  categories,
  itemCounts,
  soldOutIds,
  onSelect,
}: {
  categories: Category[];
  itemCounts: Map<string, number>;
  soldOutIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter-guest)] pb-2"
      role="list"
      aria-label="Menu categories"
    >
      {categories.map((cat) => {
        const count = itemCounts.get(cat.id) ?? 0;
        const allSoldOut = soldOutIds.has(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            role="listitem"
            onClick={() => onSelect(cat.id)}
            aria-label={`${cat.name}, ${count} item${count === 1 ? "" : "s"}${allSoldOut ? ", all sold out" : ""}`}
            className={cn(
              "group flex w-[128px] shrink-0 snap-start flex-col gap-2 text-left",
              allSoldOut && "opacity-60",
            )}
          >
            <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-border transition-colors duration-base group-hover:border-accent">
              <PlaceholderImage photoUrl={cat.photoUrl} categoryId={cat.id} alt={cat.name} rounded="rounded-xl" />
              {allSoldOut && (
                <span className="absolute inset-x-0 bottom-0 bg-roast-950/85 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-on-dark-soft">
                  Sold out
                </span>
              )}
            </span>
            <span className="grid gap-0.5 px-0.5">
              <span className="t-title-sm truncate">{cat.name}</span>
              <span className="t-caption text-text-faint">{count} item{count === 1 ? "" : "s"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
