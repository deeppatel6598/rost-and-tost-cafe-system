"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MenuItemView } from "@/lib/types";

/**
 * The guest cart.
 *
 * A cart belongs to exactly one stall — the four stalls are separate
 * businesses that each settle their own money, so mixing them in one payment
 * would mean collecting on another business's behalf. Switching stalls
 * therefore clears the cart, and the UI warns before that happens.
 */

export interface CartLine {
  /** Local id for this exact configuration of item + variant + addons. */
  lineId: string;
  itemId: string;
  variantId?: string;
  addonIds: string[];
  quantity: number;
  /** Display-only copies. The server prices the order from ids alone. */
  name: string;
  variantName?: string;
  addonNames: string[];
  unitPrice: number;
}

interface CartState {
  stallId: string | null;
  lines: CartLine[];
}

interface CartContextValue extends CartState {
  itemCount: number;
  /** Display-only running total. The server recomputes the real one. */
  displayTotal: number;
  addLine: (stallId: string, item: MenuItemView, variantId: string | undefined, addonIds: string[], quantity: number) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "sk-canteen-cart";

const CartContext = createContext<CartContextValue | null>(null);

function signature(itemId: string, variantId: string | undefined, addonIds: string[]): string {
  return `${itemId}|${variantId ?? ""}|${[...addonIds].sort().join(",")}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ stallId: null, lines: [] });
  const [hydrated, setHydrated] = useState(false);

  // Survive a refresh — students lock their phone mid-order constantly.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* corrupt or unavailable storage just means an empty cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private mode / quota — the cart still works for this page view */
    }
  }, [state, hydrated]);

  const addLine = useCallback<CartContextValue["addLine"]>((stallId, item, variantId, addonIds, quantity) => {
    setState((prev) => {
      // Switching stalls replaces the cart rather than merging.
      const base: CartState = prev.stallId && prev.stallId !== stallId ? { stallId, lines: [] } : { ...prev, stallId };

      const variant = item.variants.find((v) => v.id === variantId);
      const addons = item.addonGroups.flatMap((g) => g.addons).filter((a) => addonIds.includes(a.id));
      const unitPrice =
        item.basePrice + (variant?.priceDelta ?? 0) + addons.reduce((sum, a) => sum + a.priceDelta, 0);

      const sig = signature(item.id, variantId, addonIds);
      const existing = base.lines.find(
        (l) => signature(l.itemId, l.variantId, l.addonIds) === sig,
      );

      if (existing) {
        return {
          ...base,
          lines: base.lines.map((l) =>
            l.lineId === existing.lineId ? { ...l, quantity: l.quantity + quantity } : l,
          ),
        };
      }

      return {
        ...base,
        lines: [
          ...base.lines,
          {
            lineId: `${sig}|${Date.now()}`,
            itemId: item.id,
            variantId,
            addonIds,
            quantity,
            name: item.name,
            variantName: variant?.name,
            addonNames: addons.map((a) => a.name),
            unitPrice,
          },
        ],
      };
    });
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setState((prev) => {
      const lines =
        quantity <= 0
          ? prev.lines.filter((l) => l.lineId !== lineId)
          : prev.lines.map((l) => (l.lineId === lineId ? { ...l, quantity } : l));
      return { stallId: lines.length === 0 ? null : prev.stallId, lines };
    });
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setState((prev) => {
      const lines = prev.lines.filter((l) => l.lineId !== lineId);
      return { stallId: lines.length === 0 ? null : prev.stallId, lines };
    });
  }, []);

  const clear = useCallback(() => setState({ stallId: null, lines: [] }), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = state.lines.reduce((sum, l) => sum + l.quantity, 0);
    const displayTotal = state.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    return { ...state, itemCount, displayTotal, addLine, setQuantity, removeLine, clear };
  }, [state, addLine, setQuantity, removeLine, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
