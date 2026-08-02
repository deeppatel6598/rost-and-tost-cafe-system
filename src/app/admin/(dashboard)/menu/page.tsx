"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { Category, MenuItem } from "@/lib/types";
import { VegMark } from "@/components/ui/VegMark";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function MenuManagerPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [mRes, cRes] = await Promise.all([fetch("/api/menu"), fetch("/api/categories")]);
    if (mRes.ok) setItems((await mRes.json()).items);
    if (cRes.ok) setCategories((await cRes.json()).categories);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleAvailable(item: MenuItem) {
    setItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, available: !m.available } : m)));
    const res = await fetch(`/api/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    if (!res.ok) {
      setItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, available: item.available } : m)));
      showToast("Could not update that item.", "danger");
    }
  }

  async function remove(item: MenuItem) {
    if (!confirm(`Remove "${item.name}" from the menu? This can't be undone.`)) return;
    const res = await fetch(`/api/menu/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((m) => m.id !== item.id));
      showToast(`Removed ${item.name}`, "success");
    } else {
      showToast("Could not remove that item.", "danger");
    }
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const outCount = items.filter((i) => !i.available).length;

  if (loading) return null;

  return (
    <div className="grid gap-4 px-[var(--gutter-admin)] py-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="t-display-sm">Menu</span>
        <span className="t-body-sm text-text-muted">{outCount} sold out right now</span>
        <Link href="/admin/menu/new" className="ml-auto">
          <Button size="sm">Add item</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-surface px-5">
        {items.map((item) => {
          const category = categoryById.get(item.categoryId);
          return (
            <div key={item.id} className={`flex items-center gap-4 border-b border-border py-3 last:border-b-0 ${item.available ? "" : "opacity-60"}`}>
              <VegMark type={item.veg} />
              <div className="min-w-0 flex-1">
                <span className="t-title-sm block truncate">{item.name}</span>
                <span className="t-body-sm block text-text-muted">
                  {category?.name ?? item.categoryId} · {formatCurrency(item.price)}
                </span>
              </div>
              <span className="t-body-sm hidden text-text-muted sm:block">{item.available ? "On the menu" : "Sold out"}</span>
              <ToggleSwitch checked={item.available} onChange={() => toggleAvailable(item)} label={`Toggle ${item.name} availability`} />
              <Link href={`/admin/menu/${item.id}`} className="t-body-sm text-accent">
                Edit
              </Link>
              <button type="button" onClick={() => remove(item)} className="t-body-sm text-text-faint hover:text-danger">
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
