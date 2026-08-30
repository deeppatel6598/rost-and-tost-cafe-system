"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import type { MenuCategory, MenuItemView, StallView } from "@/lib/types";
import { GuestHeader } from "@/components/order/GuestHeader";
import { MyOrdersLink } from "@/components/order/MyOrdersLink";
import { ItemSheet } from "@/components/order/ItemSheet";
import { CartSheet } from "@/components/order/CartSheet";
import { FoodArt, artKeyFor, asArtKey } from "@/components/ui/FoodArt";
import { VegMark } from "@/components/ui/VegMark";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function MenuBrowser({
  tableNumber,
  stall,
  categories,
  items,
}: {
  tableNumber: number;
  stall: StallView;
  categories: MenuCategory[];
  items: MenuItemView[];
}) {
  const router = useRouter();
  const cart = useCart();
  const { showToast } = useToast();

  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const [sheetItemId, setSheetItemId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [liveItems, setLiveItems] = useState(items);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Sold-out toggles have to reach the guest without them reloading. Staff
  // flip these dozens of times a day and a student ordering something the
  // kitchen just ran out of is exactly what the toggle exists to prevent.
  useEffect(() => {
    let cancelled = false;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/stalls/${stall.id}/menu`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setLiveItems(data.items);
      } catch {
        /* keep the last known menu on a flaky connection */
      }
    }, 20000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [stall.id]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItemView[]>();
    for (const category of categories) {
      map.set(
        category.id,
        liveItems.filter((i) => i.categoryId === category.id),
      );
    }
    return map;
  }, [categories, liveItems]);

  const sheetItem = sheetItemId ? liveItems.find((i) => i.id === sheetItemId) ?? null : null;

  function scrollToCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    sectionRefs.current[categoryId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function quickAdd(item: MenuItemView) {
    // Anything with a required choice has to go through the sheet.
    const needsChoice = item.variants.length > 0 || item.addonGroups.some((g) => g.isRequired);
    if (needsChoice) {
      setSheetItemId(item.id);
      return;
    }
    cart.addLine(stall.id, item, undefined, [], 1);
    showToast(`Added ${item.name}`);
  }

  const cartIsForThisStall = cart.stallId === stall.id;
  const cartCount = cartIsForThisStall ? cart.itemCount : 0;
  const cartTotal = cartIsForThisStall ? cart.displayTotal : 0;

  return (
    <>
      <GuestHeader
        tableNumber={tableNumber}
        title={stall.name}
        backHref="/order"
        right={<MyOrdersLink />}
      />

      {!stall.availability.canOrder && (
        <p className="border-b border-border bg-status-cancelled-bg px-4 py-2.5 text-center text-[13px] font-medium text-status-cancelled-ink">
          {stall.name} is {stall.availability.label.toLowerCase()} — you can browse, but not order right now.
        </p>
      )}

      {/* Category strip. Sticks under the header so the menu stays reachable. */}
      <div className="sticky top-[57px] z-20 flex-none border-b border-border bg-bg">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => scrollToCategory(category.id)}
              className={cn(
                "h-9 shrink-0 whitespace-nowrap rounded-pill border px-4 text-sm font-semibold transition-colors",
                activeCategoryId === category.id
                  ? "border-accent bg-accent-tint text-accent"
                  : "border-border text-text-muted",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[120px] pt-2">
        {categories.map((category) => {
          const categoryItems = itemsByCategory.get(category.id) ?? [];
          if (categoryItems.length === 0) return null;
          return (
            <section
              key={category.id}
              ref={(el) => {
                sectionRefs.current[category.id] = el;
              }}
              className="scroll-mt-[112px] pt-4"
            >
              <h2 className="t-overline mb-1 text-text-faint">{category.name}</h2>
              {categoryItems.map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  canOrder={stall.availability.canOrder}
                  onOpen={() => setSheetItemId(item.id)}
                  onQuickAdd={() => quickAdd(item)}
                />
              ))}
            </section>
          );
        })}
      </div>

      {cartCount > 0 && (
        <div className="sticky bottom-0 z-20 flex-none border-t border-border bg-surface px-4 py-3">
          <Button size="hero" fullWidth onClick={() => setCartOpen(true)}>
            <span className="flex w-full items-center justify-between">
              <span>
                {cartCount} item{cartCount === 1 ? "" : "s"}
              </span>
              <span>View cart · {formatCurrency(cartTotal)}</span>
            </span>
          </Button>
        </div>
      )}

      <ItemSheet
        item={sheetItem}
        stallId={stall.id}
        canOrder={stall.availability.canOrder}
        open={sheetItemId !== null}
        onClose={() => setSheetItemId(null)}
        onAdded={(name) => showToast(`Added ${name}`)}
      />

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        stall={stall}
        onCheckout={() => router.push(`/order/${stall.id}/checkout`)}
      />
    </>
  );
}

function MenuItemRow({
  item,
  canOrder,
  onOpen,
  onQuickAdd,
}: {
  item: MenuItemView;
  canOrder: boolean;
  onOpen: () => void;
  onQuickAdd: () => void;
}) {
  const soldOut = !item.isAvailable;
  const hasChoices = item.variants.length > 0 || item.addonGroups.length > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border py-3 last:border-b-0",
        // An unavailable item must look unavailable before it is tapped, not
        // after — but it stays on the menu, because a student looking for it
        // needs to see it is sold out rather than assume the app is broken.
        soldOut && "opacity-55",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${item.name}${soldOut ? ", sold out" : ""}`}
        className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-lg"
      >
        <FoodArt art={item.art ? asArtKey(item.art) : artKeyFor(item.id, item.categoryId)} />
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-roast-950/85 py-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-on-dark-soft">
            Sold out
          </span>
        )}
      </button>

      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="mb-0.5 flex items-center gap-2">
          <VegMark type={item.foodType} size={14} />
          <span className="t-title-sm truncate">{item.name}</span>
        </span>
        <span className="t-body-sm line-clamp-2 block text-text-muted">{item.description}</span>
        <span className="t-mono mt-1 block text-[15px]">{formatCurrency(item.basePrice)}</span>
      </button>

      <div className="shrink-0">
        {soldOut ? (
          <span className="t-caption text-text-faint">Sold out</span>
        ) : !canOrder ? (
          <span className="t-caption text-text-faint">Closed</span>
        ) : (
          <div className="grid gap-0.5">
            <Button size="sm" variant="secondary" onClick={onQuickAdd} aria-label={`Add ${item.name}`}>
              Add
            </Button>
            {hasChoices && <span className="text-center text-[10px] text-text-faint">customisable</span>}
          </div>
        )}
      </div>
    </div>
  );
}
