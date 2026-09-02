"use client";

import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { MenuCategory, MenuItemView, StallView } from "@/lib/types";
import { FoodArt, artKeyFor, asArtKey } from "@/components/ui/FoodArt";
import { VegMark } from "@/components/ui/VegMark";
import { Icon } from "@/components/ui/Icon";

/**
 * Pieces shared by all three stall menu layouts.
 *
 * The layouts differ on purpose — four independent businesses shouldn't look
 * like four tabs of one app — but the things that must never vary between
 * them live here: the food-type mark, how a sold-out item reads, and how a
 * price is written.
 */

export interface MenuLayoutProps {
  stall: StallView;
  categories: MenuCategory[];
  items: MenuItemView[];
  onOpenItem: (itemId: string) => void;
  onQuickAdd: (item: MenuItemView) => void;
}

/** Product artwork on its brand-tinted plate. */
export function ItemArt({
  item,
  className,
  rounded = "rounded-2xl",
  bare = false,
}: {
  item: MenuItemView;
  className?: string;
  rounded?: string;
  /** Drop the artwork's own backdrop so it floats on a brand-coloured card. */
  bare?: boolean;
}) {
  if (item.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.imageUrl} alt={item.name} className={cn("h-full w-full object-cover", rounded, className)} />;
  }
  return (
    <span className={cn("block h-full w-full overflow-hidden", rounded, className)}>
      <FoodArt art={item.art ? asArtKey(item.art) : artKeyFor(item.id, item.categoryId)} bare={bare} />
    </span>
  );
}

/**
 * A sold-out item stays on the menu but must look unavailable *before* it is
 * tapped — a student hunting for a specific dish needs to see it is off,
 * otherwise they assume the app is broken and ask staff anyway.
 */
export function SoldOutVeil({ rounded = "rounded-2xl" }: { rounded?: string }) {
  return (
    <span
      className={cn(
        "absolute inset-0 grid place-items-end justify-center bg-roast-950/55 pb-2",
        rounded,
      )}
    >
      <span className="rounded-pill bg-roast-950/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-on-dark">
        Sold out
      </span>
    </span>
  );
}

export function Price({ value, className }: { value: number; className?: string }) {
  return <span className={cn("t-mono font-semibold", className)}>{formatCurrency(value)}</span>;
}

export function NameWithMark({
  item,
  className,
  markSize = 14,
  wrap = false,
}: {
  item: MenuItemView;
  className?: string;
  markSize?: number;
  /** Allow the name onto a second line — narrow cards otherwise clip it. */
  wrap?: boolean;
}) {
  return (
    <span className={cn("flex gap-2", wrap ? "items-start" : "items-center", className)}>
      <span className={cn("shrink-0", wrap && "mt-1")}>
        <VegMark type={item.foodType} size={markSize} />
      </span>
      <span className={wrap ? "line-clamp-2 min-w-0" : "truncate"}>{item.name}</span>
    </span>
  );
}

/** Round add button used by the layouts that put the action on the card. */
export function AddButton({
  item,
  onQuickAdd,
  tone = "dark",
  size = "md",
}: {
  item: MenuItemView;
  onQuickAdd: () => void;
  tone?: "dark" | "brand" | "light";
  size?: "md" | "lg";
}) {
  const disabled = !item.isAvailable;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={disabled ? `${item.name} is sold out` : `Add ${item.name}`}
      onClick={(e) => {
        e.stopPropagation();
        onQuickAdd();
      }}
      className={cn(
        // 44px minimum: this is the most-tapped control in the app and it sits
        // next to a price, so a near-miss adds the wrong thing to the cart.
        "grid shrink-0 place-items-center rounded-xl transition-transform active:scale-90",
        size === "lg" ? "h-12 w-12" : "h-11 w-11",
        disabled && "cursor-not-allowed opacity-40",
        tone === "dark" && "bg-ink-900 text-white",
        tone === "brand" && "bg-brand-500 text-brand-ink",
        tone === "light" && "bg-white text-ink-900 u-lift-1",
      )}
    >
      <Icon name="plus" size={size === "lg" ? 24 : 20} strokeWidth={2.25} />
    </button>
  );
}

/** Groups items under their category, dropping empty categories. */
export function groupByCategory(categories: MenuCategory[], items: MenuItemView[]) {
  return categories
    .map((category) => ({
      category,
      items: items.filter((i) => i.categoryId === category.id),
    }))
    .filter((g) => g.items.length > 0);
}
