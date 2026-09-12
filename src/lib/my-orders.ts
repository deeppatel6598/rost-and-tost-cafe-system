"use client";

/**
 * Remembers which orders belong to this browser.
 *
 * There are no guest accounts, so the public token is the only handle a
 * student has on their order. Keeping the tokens locally lets them close the
 * tab, lock their phone, and still find "my orders" when they come back.
 */

const STORAGE_KEY = "sk-canteen-my-orders";
const MAX_REMEMBERED = 25;

export interface RememberedOrder {
  publicToken: string;
  subOrderId: string;
  tokenNumber: string;
  stallName: string;
  placedAt: string;
}

export function listRememberedOrders(): RememberedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberOrder(order: RememberedOrder): void {
  try {
    const existing = listRememberedOrders().filter((o) => o.subOrderId !== order.subOrderId);
    const next = [order, ...existing].slice(0, MAX_REMEMBERED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the current screen still shows the order */
  }
}

/** Distinct public tokens, newest first, for the "my orders" screen. */
/**
 * Forget everything this browser remembers.
 *
 * Used when a student hands the phone to someone else. The server-side sitting
 * is ended separately; this clears the local cache so no stale status link is
 * left behind for the next person to open.
 */
export function clearRememberedOrders(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — nothing was cached to begin with */
  }
}

export function listRememberedTokens(): string[] {
  const seen = new Set<string>();
  for (const order of listRememberedOrders()) {
    seen.add(order.publicToken);
  }
  return Array.from(seen);
}
