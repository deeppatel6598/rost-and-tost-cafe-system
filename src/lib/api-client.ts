import type { CartLineInput, Category, MenuItem, Order, Table } from "@/lib/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request to ${url} failed with ${res.status}`);
  }
  return data as T;
}

export const api = {
  categories: () => request<{ categories: Category[] }>("/api/categories"),
  menu: () => request<{ items: MenuItem[] }>("/api/menu"),
  tables: () => request<{ tables: Table[] }>("/api/tables"),
  order: (id: string) => request<{ order: Order }>(`/api/orders/${id}`),
  createOrder: (tableNumber: number, tableToken: string, lines: CartLineInput[], note?: string) =>
    request<{ order: Order }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({ tableNumber, tableToken, lines, note }),
    }),
};
