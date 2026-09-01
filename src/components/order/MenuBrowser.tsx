"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import type { MenuCategory, MenuItemView, StallView } from "@/lib/types";
import { GuestHeader } from "@/components/order/GuestHeader";
import { MyOrdersLink } from "@/components/order/MyOrdersLink";
import { ItemSheet } from "@/components/order/ItemSheet";
import { CartSheet } from "@/components/order/CartSheet";
import { SideTabsMenu } from "@/components/order/menu/SideTabsMenu";
import { OffersMenu } from "@/components/order/menu/OffersMenu";
import { HeroMenu } from "@/components/order/menu/HeroMenu";
import type { MenuLayoutProps } from "@/components/order/menu/shared";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

/**
 * The chrome around a stall's menu: header, closed notice, cart bar and the
 * two sheets. The list itself is whichever layout the stall is set to, because
 * these are four separate businesses and should not read as four tabs of one
 * app. Everything that has to behave identically — pricing, sold-out handling,
 * the item sheet, the cart — lives here rather than in the layouts.
 */
const LAYOUTS: Record<StallView["menuLayout"], React.ComponentType<MenuLayoutProps>> = {
  sidetabs: SideTabsMenu,
  offers: OffersMenu,
  hero: HeroMenu,
};

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

  const [sheetItemId, setSheetItemId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [liveItems, setLiveItems] = useState(items);

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

  const sheetItem = sheetItemId ? liveItems.find((i) => i.id === sheetItemId) ?? null : null;

  function quickAdd(item: MenuItemView) {
    if (!stall.availability.canOrder) {
      showToast(`${stall.name} is not taking orders right now`);
      return;
    }
    if (!item.isAvailable) {
      showToast(`${item.name} is sold out`);
      return;
    }
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

  const Layout = LAYOUTS[stall.menuLayout] ?? HeroMenu;

  return (
    <div data-stall={stall.id} className="flex min-h-0 flex-1 flex-col">
      <GuestHeader
        tableNumber={tableNumber}
        title={stall.name}
        backHref="/order"
        right={<MyOrdersLink />}
      />

      {!stall.availability.canOrder && (
        <p className="flex-none border-b border-border bg-status-cancelled-bg px-4 py-2.5 text-center text-[13px] font-medium text-status-cancelled-ink">
          {stall.availability.label} — you can browse the menu, but not order right now.
        </p>
      )}

      <Layout
        stall={stall}
        categories={categories}
        items={liveItems}
        onOpenItem={(id) => setSheetItemId(id)}
        onQuickAdd={quickAdd}
      />

      {cartCount > 0 && (
        // Frosted, because this bar sits over a scrolling list and needs to
        // read as floating above it rather than as the end of the page.
        <div className="sticky bottom-0 z-30 flex-none border-t border-border px-4 py-3 u-frost">
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
    </div>
  );
}
