"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { AddButton, ItemArt, NameWithMark, Price, SoldOutVeil, groupByCategory, type MenuLayoutProps } from "./shared";

/**
 * Jay Bhavani — vertical category rail.
 *
 * A short counter menu split into a few clear groups, so the categories live
 * in a fixed rail down the left edge and stay reachable with the thumb while
 * the list scrolls. Item cards are photo-left, brand-panel-right, which keeps
 * the food itself as the biggest thing on a busy screen.
 */
export function SideTabsMenu({ stall, categories, items, onOpenItem, onQuickAdd }: MenuLayoutProps) {
  const groups = groupByCategory(categories, items);
  const [activeId, setActiveId] = useState(groups[0]?.category.id ?? "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollerRef = useRef<HTMLDivElement>(null);

  function jumpTo(categoryId: string) {
    setActiveId(categoryId);
    sectionRefs.current[categoryId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Keeps the rail in step with whichever section is under the header. */
  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const top = scroller.getBoundingClientRect().top + 80;
    let current = groups[0]?.category.id ?? "";
    for (const group of groups) {
      const el = sectionRefs.current[group.category.id];
      if (el && el.getBoundingClientRect().top <= top) current = group.category.id;
    }
    setActiveId(current);
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Fixed category rail, text rotated to run down the edge. */}
      <nav
        aria-label="Menu categories"
        className="flex w-[54px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-border bg-surface-sunken py-3"
      >
        {groups.map(({ category }) => {
          const active = category.id === activeId;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => jumpTo(category.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "relative mx-auto flex min-h-[104px] w-[42px] items-center justify-center rounded-xl transition-colors",
                active ? "u-brand-grad text-brand-ink" : "bg-surface text-text-muted",
              )}
            >
              <span
                className="whitespace-nowrap text-[12px] font-bold tracking-wide"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {category.name}
              </span>
            </button>
          );
        })}
      </nav>

      <div ref={scrollerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pb-[132px]">
        <div className="px-4 pt-4">
          <p className="t-body-sm text-text-muted">{stall.tagline}</p>
        </div>

        {groups.map(({ category, items: categoryItems }) => (
          <section
            key={category.id}
            ref={(el) => {
              sectionRefs.current[category.id] = el;
            }}
            className="scroll-mt-4 px-4 pt-5"
          >
            <h2 className="t-overline mb-3 text-text-faint">{category.name}</h2>

            <div className="grid gap-4">
              {categoryItems.map((item) => (
                <article
                  key={item.id}
                  className={cn("relative flex items-stretch", !item.isAvailable && "opacity-70")}
                >
                  {/* Photo overlaps the brand panel, so the food breaks the
                      card edge rather than sitting inside a neat box. */}
                  <button
                    type="button"
                    onClick={() => onOpenItem(item.id)}
                    aria-label={`View ${item.name}`}
                    className="relative z-10 h-[116px] w-[116px] shrink-0 self-center overflow-hidden rounded-2xl u-photo-plate u-lift-2"
                  >
                    <ItemArt item={item} />
                    {!item.isAvailable && <SoldOutVeil />}
                  </button>

                  {/* The panel is a plain div, not a button: the add control
                      lives inside it and a button cannot nest in a button. */}
                  <div className="-ml-5 flex min-w-0 flex-1 flex-col justify-between rounded-r-2xl u-brand-grad py-3 pl-8 pr-3">
                    <button
                      type="button"
                      onClick={() => onOpenItem(item.id)}
                      className="min-w-0 text-left"
                    >
                      <NameWithMark
                        item={item}
                        className="t-title-sm text-brand-ink"
                        markSize={13}
                      />
                      <span className="mt-1 line-clamp-2 block text-[12px] leading-snug text-brand-ink/70">
                        {item.description}
                      </span>
                    </button>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <Price value={item.basePrice} className="text-[17px] text-brand-ink" />
                      <AddButton item={item} onQuickAdd={() => onQuickAdd(item)} tone="light" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
