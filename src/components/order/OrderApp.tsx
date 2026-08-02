"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { CartProvider, useCart } from "@/context/CartContext";
import { entryUnitPrice } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";
import type { Category, MenuItem, Order } from "@/lib/types";
import { TableBadge } from "@/components/order/TableBadge";
import { LandingView } from "@/components/order/LandingView";
import { CategoryCarousel } from "@/components/order/CategoryCarousel";
import { ItemRow } from "@/components/order/ItemRow";
import { ItemSheet } from "@/components/order/ItemSheet";
import { CartView } from "@/components/order/CartView";
import { PlacedView } from "@/components/order/PlacedView";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

type View = "landing" | "menu" | "cart" | "placed";

export function OrderApp({ tableNumber, cafeName }: { tableNumber: number; cafeName: string }) {
  return (
    <CartProvider>
      <OrderAppInner tableNumber={tableNumber} cafeName={cafeName} />
    </CartProvider>
  );
}

function OrderAppInner({ tableNumber, cafeName }: { tableNumber: number; cafeName: string }) {
  const { showToast } = useToast();
  const cart = useCart();

  const [view, setView] = useState<View>("landing");
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [sheetItemId, setSheetItemId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [{ categories: cats }, { items }] = await Promise.all([api.categories(), api.menu()]);
        if (cancelled) return;
        setCategories(cats);
        setMenuItems(items);
        setSelectedCategoryId((prev) => prev || cats[0]?.id || "");
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load the menu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const poll = setInterval(async () => {
      try {
        const { items } = await api.menu();
        if (!cancelled) setMenuItems(items);
      } catch {
        /* keep last known menu on transient network errors */
      }
    }, 15000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (view !== "placed" || !placedOrder) return;
    let cancelled = false;
    const poll = setInterval(async () => {
      try {
        const { order } = await api.order(placedOrder.id);
        if (!cancelled) setPlacedOrder(order);
      } catch {
        /* keep last known status on transient network errors */
      }
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
    // Poll keyed on the order id, not the whole object — including `placedOrder`
    // itself would restart this interval on every status update it produces.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, placedOrder?.id]);

  const menuById = useMemo(() => new Map(menuItems.map((m) => [m.id, m])), [menuItems]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const soldOutCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cat of categories) {
      const items = menuItems.filter((m) => m.categoryId === cat.id);
      if (items.length > 0 && items.every((m) => !m.available)) ids.add(cat.id);
    }
    return ids;
  }, [categories, menuItems]);

  const visibleItems = useMemo(
    () => menuItems.filter((m) => m.categoryId === selectedCategoryId),
    [menuItems, selectedCategoryId],
  );

  const cartTotal = useMemo(
    () =>
      cart.entries.reduce((sum, e) => {
        const item = menuById.get(e.menuItemId);
        return item ? sum + entryUnitPrice(item, e.selectedChoiceIds) * e.qty : sum;
      }, 0),
    [cart.entries, menuById],
  );
  const cartCount = cart.entries.reduce((sum, e) => sum + e.qty, 0);

  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    setCollapsed(listRef.current.scrollTop > 12);
  }, []);

  function quickAdd(item: MenuItem) {
    cart.addEntry(item.id, 1, []);
    showToast(`Added ${item.name}`);
  }

  async function placeOrder() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { order } = await api.createOrder(
        tableNumber,
        cart.entries.map((e) => ({ menuItemId: e.menuItemId, qty: e.qty, selectedChoiceIds: e.selectedChoiceIds, lineNote: e.lineNote })),
        orderNote.trim() || undefined,
      );
      setPlacedOrder(order);
      cart.clear();
      setOrderNote("");
      setView("placed");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not place your order.");
    } finally {
      setSubmitting(false);
    }
  }

  const sheetItem = sheetItemId ? menuById.get(sheetItemId) ?? null : null;
  const sheetCategoryIcon = sheetItem ? categoryById.get(sheetItem.categoryId)?.icon ?? "desserts" : "desserts";

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="t-title-md">Couldn't load the menu</span>
        <span className="t-body-sm text-text-muted">{loadError}</span>
        <Button size="sm" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-none items-center gap-3 border-b border-border bg-bg px-[var(--gutter-guest)] py-3.5">
        <TableBadge tableNumber={tableNumber} />
        <span className="t-display-xs">{cafeName}</span>
        <Link href="/" className="ml-auto text-[13px] font-medium text-text-faint">
          Site
        </Link>
      </header>

      {view === "landing" && <LandingView tableNumber={tableNumber} cafeName={cafeName} onStart={() => setView("menu")} />}

      {view === "menu" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-none pt-3">
            <h1 className="mb-2 px-[var(--gutter-guest)] t-display-xs">What are we making?</h1>
            <CategoryCarousel
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              soldOutIds={soldOutCategoryIds}
              collapsed={collapsed}
            />
          </div>
          <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-[var(--gutter-guest)] pb-[120px]">
            {visibleItems.length === 0 && (
              <p className="t-body-sm py-10 text-center text-text-muted">Nothing in this category right now.</p>
            )}
            {visibleItems.map((item) => {
              const category = categoryById.get(item.categoryId);
              const quickQty = cart.entries
                .filter((e) => e.menuItemId === item.id && e.selectedChoiceIds.length === 0)
                .reduce((sum, e) => sum + e.qty, 0);
              return (
                <ItemRow
                  key={item.id}
                  item={item}
                  categoryIcon={category?.icon ?? "desserts"}
                  quickQty={quickQty}
                  onOpen={() => setSheetItemId(item.id)}
                  onQuickAdd={() => quickAdd(item)}
                />
              );
            })}
          </div>
        </div>
      )}

      {view === "cart" && (
        <div className="flex-1 overflow-y-auto px-[var(--gutter-guest)] pb-[140px] pt-4">
          <div className="mb-3 flex items-center gap-3">
            <button
              type="button"
              aria-label="Back to menu"
              onClick={() => setView("menu")}
              className="grid h-11 w-11 place-items-center rounded-md border border-border bg-surface-raised text-text"
            >
              ←
            </button>
            <span className="t-display-xs">Your order</span>
          </div>
          {submitError && (
            <p className="t-body-sm mb-3 rounded-md bg-status-cancelled-bg px-3 py-2 text-status-cancelled-ink">{submitError}</p>
          )}
          <CartView
            entries={cart.entries}
            menuById={menuById}
            onQty={cart.setQty}
            onRemove={cart.removeEntry}
            note={orderNote}
            onNoteChange={setOrderNote}
            onBackToMenu={() => setView("menu")}
          />
        </div>
      )}

      {view === "placed" && placedOrder && (
        <div className="flex-1 overflow-y-auto px-[var(--gutter-guest)] pb-[40px] pt-5">
          <PlacedView order={placedOrder} onAddMore={() => setView("menu")} />
        </div>
      )}

      {view === "menu" && (
        <div className="sticky bottom-0 z-20 flex-none border-t border-border bg-surface px-[var(--gutter-guest)] py-3">
          <div className="flex items-center gap-4">
            <div className="grid">
              <span className="t-caption text-text-muted">{cartCount} item{cartCount === 1 ? "" : "s"}</span>
              <span className="t-display-xs">{formatCurrency(cartTotal)}</span>
            </div>
            <Button size="guest" fullWidth disabled={cartCount === 0} onClick={() => setView("cart")} className="flex-1">
              View order
            </Button>
          </div>
        </div>
      )}
      {view === "cart" && (
        <div className="sticky bottom-0 z-20 flex-none border-t border-border bg-surface px-[var(--gutter-guest)] py-3">
          <Button size="hero" fullWidth disabled={cartCount === 0 || submitting} onClick={placeOrder}>
            {submitting ? <Spinner /> : `Place order · ${formatCurrency(cartTotal)}`}
          </Button>
          <p className="t-caption mt-2 text-center text-text-faint">Sends straight to the kitchen. Pay at the counter afterwards.</p>
        </div>
      )}

      <ItemSheet
        item={sheetItem}
        categoryIcon={sheetCategoryIcon}
        open={sheetItemId !== null}
        onClose={() => setSheetItemId(null)}
        onAdd={(qty, selectedChoiceIds, note) => {
          if (!sheetItem) return;
          cart.addEntry(sheetItem.id, qty, selectedChoiceIds, note);
          showToast(`Added ${sheetItem.name}`);
        }}
      />
    </>
  );
}
