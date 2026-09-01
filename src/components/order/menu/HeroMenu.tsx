"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { AddButton, ItemArt, NameWithMark, Price, SoldOutVeil, groupByCategory, type MenuLayoutProps } from "./shared";

/**
 * Tea Post — brand hero with search.
 *
 * A chai counter has a wide, shallow range where people arrive knowing what
 * they want ("kadak chai, bun maska"), so search is the fastest path and sits
 * in the hero. Below it, a rail of the counter's own picks, then a plain
 * scannable list — the range is too wide for a grid of photos to help.
 */
export function HeroMenu({ stall, categories, items, onOpenItem, onQuickAdd }: MenuLayoutProps) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => groupByCategory(categories, items), [categories, items]);

  const picks = useMemo(() => items.filter((i) => i.isAvailable).slice(0, 6), [items]);

  const q = query.trim().toLowerCase();
  const results = useMemo(
    () => (q ? items.filter((i) => `${i.name} ${i.description}`.toLowerCase().includes(q)) : []),
    [items, q],
  );

  return (
    <div className="flex-1 overflow-y-auto pb-[132px]">
      {/* Hero. Rounded off at the bottom so the list below reads as a separate
          sheet sliding under it rather than a second block of colour. */}
      <div className="rounded-b-card-lg u-brand-grad px-4 pb-6 pt-5">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand-ink/70">Table service</p>
        <h1 className="t-display-xs mt-1 leading-tight text-brand-ink">{stall.tagline}</h1>

        <label className="mt-4 flex h-12 items-center gap-2.5 rounded-pill bg-surface px-4 u-lift-2">
          <span aria-hidden="true" className="text-[15px] text-text-faint">
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chai, maggi, bun maska…"
            aria-label={`Search the ${stall.name} menu`}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-text-faint"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="shrink-0 text-[13px] font-semibold text-text-muted"
            >
              Clear
            </button>
          )}
        </label>
      </div>

      {q ? (
        <section className="px-4 pt-5">
          <h2 className="t-title-sm mb-3">
            {results.length} result{results.length === 1 ? "" : "s"} for “{query.trim()}”
          </h2>
          {results.length === 0 ? (
            <p className="t-body-sm text-text-muted">
              Nothing on this menu matches. Try a shorter word, or clear the search to browse.
            </p>
          ) : (
            <div className="grid gap-1">
              {results.map((item) => (
                <ListRow key={item.id} item={item} onOpenItem={onOpenItem} onQuickAdd={onQuickAdd} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {picks.length > 0 && (
            <section className="pt-5">
              <h2 className="t-title-sm mb-3 px-4">Straight off the counter</h2>
              <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
                {picks.map((item) => (
                  <article
                    key={item.id}
                    className="w-[148px] shrink-0 overflow-hidden rounded-card bg-surface u-lift-2"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenItem(item.id)}
                      aria-label={`View ${item.name}`}
                      className="block w-full text-left"
                    >
                      <span className="relative block h-[104px] w-full u-photo-plate">
                        <ItemArt item={item} rounded="rounded-none" />
                        {!item.isAvailable && <SoldOutVeil rounded="rounded-none" />}
                      </span>
                      <NameWithMark item={item} className="t-title-sm min-h-[46px] px-3 pt-3" markSize={12} wrap />
                    </button>
                    <div className="flex items-center justify-between px-3 pb-3 pt-1.5">
                      <Price value={item.basePrice} className="text-[15px]" />
                      <AddButton item={item} onQuickAdd={() => onQuickAdd(item)} tone="brand" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {groups.map(({ category, items: categoryItems }) => (
            <section key={category.id} className="px-4 pt-6">
              <h2 className="t-title-sm mb-3">{category.name}</h2>
              <div className="grid gap-1">
                {categoryItems.map((item) => (
                  <ListRow key={item.id} item={item} onOpenItem={onOpenItem} onQuickAdd={onQuickAdd} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function ListRow({
  item,
  onOpenItem,
  onQuickAdd,
}: {
  item: MenuLayoutProps["items"][number];
  onOpenItem: MenuLayoutProps["onOpenItem"];
  onQuickAdd: MenuLayoutProps["onQuickAdd"];
}) {
  return (
    <article
      className={cn(
        "flex items-center gap-3 rounded-card bg-surface p-2.5 u-lift-1",
        !item.isAvailable && "opacity-70",
      )}
    >
      <button
        type="button"
        onClick={() => onOpenItem(item.id)}
        aria-label={`View ${item.name}`}
        className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-xl u-photo-plate"
      >
        <ItemArt item={item} rounded="rounded-xl" />
        {!item.isAvailable && <SoldOutVeil rounded="rounded-xl" />}
      </button>

      <button type="button" onClick={() => onOpenItem(item.id)} className="min-w-0 flex-1 text-left">
        <NameWithMark item={item} className="t-title-sm" markSize={12} />
        <span className="t-caption mt-0.5 line-clamp-1 block text-text-muted">{item.description}</span>
        <Price value={item.basePrice} className="mt-1 block text-[15px]" />
      </button>

      <AddButton item={item} onQuickAdd={() => onQuickAdd(item)} tone="brand" />
    </article>
  );
}
