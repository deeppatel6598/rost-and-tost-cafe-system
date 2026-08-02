"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { generateId } from "@/lib/format";
import { entrySignature, type CartEntry } from "@/lib/cart";

interface CartContextValue {
  entries: CartEntry[];
  addEntry: (menuItemId: string, qty: number, selectedChoiceIds: CartEntry["selectedChoiceIds"], lineNote?: string) => void;
  setQty: (localId: string, qty: number) => void;
  removeEntry: (localId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<CartEntry[]>([]);

  const addEntry = useCallback<CartContextValue["addEntry"]>((menuItemId, qty, selectedChoiceIds, lineNote) => {
    setEntries((prev) => {
      const sig = entrySignature(menuItemId, selectedChoiceIds, lineNote);
      const existing = prev.find((e) => entrySignature(e.menuItemId, e.selectedChoiceIds, e.lineNote) === sig);
      if (existing) {
        return prev.map((e) => (e.localId === existing.localId ? { ...e, qty: e.qty + qty } : e));
      }
      return [...prev, { localId: generateId("cart"), menuItemId, qty, selectedChoiceIds, lineNote }];
    });
  }, []);

  const setQty = useCallback((localId: string, qty: number) => {
    setEntries((prev) => (qty <= 0 ? prev.filter((e) => e.localId !== localId) : prev.map((e) => (e.localId === localId ? { ...e, qty } : e))));
  }, []);

  const removeEntry = useCallback((localId: string) => {
    setEntries((prev) => prev.filter((e) => e.localId !== localId));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  const value = useMemo(() => ({ entries, addEntry, setQty, removeEntry, clear }), [entries, addEntry, setQty, removeEntry, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
