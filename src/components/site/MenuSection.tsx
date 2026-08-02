"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { Category, MenuItem } from "@/lib/types";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { VegMark } from "@/components/ui/VegMark";

export function MenuSection({ categories, items }: { categories: Category[]; items: MenuItem[] }) {
  const [activeCat, setActiveCat] = useState("all");
  const visible = items.filter((i) => activeCat === "all" || i.categoryId === activeCat);

  return (
    <section id="menu" className="bg-paper-0">
      <div className="mx-auto max-w-[1200px] px-[clamp(16px,4vw,40px)] py-[clamp(44px,7vw,88px)]">
        <div className="flex flex-wrap items-end gap-4 pb-6">
          <h2 className="t-display-lg">The menu</h2>
          <p className="mb-1.5 max-w-[44ch] text-[16px] text-text-muted">
            Roasted in small batches, baked the same morning. Prices include tax.
          </p>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-8">
          <button
            type="button"
            onClick={() => setActiveCat("all")}
            className={cn(
              "h-11 shrink-0 whitespace-nowrap rounded-md border px-5 text-[15px] font-semibold transition-colors duration-base",
              activeCat === "all" ? "border-border-strong bg-paper-3 text-text" : "border-border text-text-muted",
            )}
          >
            Everything
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCat(c.id)}
              className={cn(
                "h-11 shrink-0 whitespace-nowrap rounded-md border px-5 text-[15px] font-semibold transition-colors duration-base",
                activeCat === c.id ? "border-border-strong bg-paper-3 text-text" : "border-border text-text-muted",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 sm:gap-8">
          {visible.map((item) => {
            const category = categories.find((c) => c.id === item.categoryId);
            return (
              <article
                key={item.id}
                className={cn("grid gap-3 rounded-lg border border-border bg-surface p-3", !item.available && "opacity-55")}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-md">
                  <PlaceholderImage photoUrl={item.photoUrl} icon={category?.icon ?? "desserts"} alt={item.name} rounded="rounded-md" />
                </div>
                <div className="flex items-start gap-3 px-1">
                  <div className="min-w-0 flex-1 grid gap-1.5">
                    <div className="flex items-center gap-2">
                      <VegMark type={item.veg} />
                      <span className="t-title-sm truncate">{item.name}</span>
                    </div>
                    <span className="t-body-sm text-text-muted">{item.description}</span>
                    <span className="t-caption text-text-faint">{item.available ? item.badge ?? category?.name : "Sold out today"}</span>
                  </div>
                  <span className="t-display-xs">{formatCurrency(item.price)}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
