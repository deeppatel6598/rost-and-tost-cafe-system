"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { MenuCategory, MenuItemView } from "@/lib/types";
import { VegMark } from "@/components/ui/VegMark";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

export function MenuManager() {
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItemView[] | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/menu");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items);
    setCategories(data.categories);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * The sold-out toggle. One tap, no confirmation dialog, instant visual
   * feedback — this gets used dozens of times a day mid-rush, so it flips
   * locally first and only reverts if the server disagrees.
   */
  async function toggleAvailability(item: MenuItemView) {
    const next = !item.isAvailable;
    setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, isAvailable: next } : i)) ?? prev);

    try {
      const res = await fetch(`/api/admin/menu/${item.id}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, isAvailable: item.isAvailable } : i)) ?? prev);
      showToast(`Could not update ${item.name}.`, "danger");
    }
  }

  async function removeItem(item: MenuItemView) {
    if (!confirm(`Remove "${item.name}" from the menu?`)) return;
    const res = await fetch(`/api/admin/menu/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? prev);
      showToast(`Removed ${item.name}`, "success");
    } else {
      showToast("Could not remove that item.", "danger");
    }
  }

  if (items === null) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }

  const soldOutCount = items.filter((i) => !i.isAvailable).length;

  return (
    <div className="grid gap-5 px-4 py-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="t-display-sm">Menu</span>
        <span className="t-body-sm text-text-muted">{soldOutCount} sold out right now</span>
        <Link href="/admin/menu/new" className="ml-auto no-underline">
          <Button size="sm">Add item</Button>
        </Link>
      </div>

      {categories.map((category) => {
        const categoryItems = items.filter((i) => i.categoryId === category.id);
        if (categoryItems.length === 0) return null;

        return (
          <section key={category.id} className="grid gap-2">
            <h2 className="t-overline text-text-faint">{category.name}</h2>
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
                    !item.isAvailable && "bg-surface-sunken",
                  )}
                >
                  <VegMark type={item.foodType} />
                  <div className={cn("min-w-0 flex-1", !item.isAvailable && "opacity-60")}>
                    <span className="t-title-sm block truncate">{item.name}</span>
                    <span className="t-body-sm block text-text-muted">
                      {formatCurrency(item.basePrice)}
                      {item.variants.length > 0 && ` · ${item.variants.length} sizes`}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "hidden w-24 shrink-0 text-right text-[13px] font-semibold sm:block",
                      item.isAvailable ? "text-status-served-ink" : "text-text-faint",
                    )}
                  >
                    {item.isAvailable ? "On menu" : "Sold out"}
                  </span>

                  <ToggleSwitch
                    checked={item.isAvailable}
                    onChange={() => toggleAvailability(item)}
                    label={`${item.name} availability`}
                  />

                  <Link href={`/admin/menu/${item.id}`} className="t-body-sm shrink-0">
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    className="t-body-sm shrink-0 text-text-faint hover:text-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
