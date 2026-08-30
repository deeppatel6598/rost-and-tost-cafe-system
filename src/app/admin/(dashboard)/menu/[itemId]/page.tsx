"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { MenuCategory, MenuItemView } from "@/lib/types";
import { MenuItemForm, type MenuItemFormValues } from "@/components/admin/MenuItemForm";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams<{ itemId: string }>();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [item, setItem] = useState<MenuItemView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/menu").then((r) => (r.ok ? r.json() : { categories: [] })),
      fetch(`/api/admin/menu/${params.itemId}`).then(async (r) => ({ ok: r.ok, data: await r.json() })),
    ]).then(([menuData, itemRes]) => {
      setCategories(menuData.categories ?? []);
      if (itemRes.ok) setItem(itemRes.data.item);
      else setNotFound(true);
    });
  }, [params.itemId]);

  async function handleSubmit(values: MenuItemFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/menu/${params.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Saved ${values.name}`, "success");
      router.push("/admin/menu");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) return <p className="px-4 py-5">That item is not on your menu.</p>;
  if (!item || categories.length === 0) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-7 w-7 text-accent" />
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <span className="t-display-sm mb-5 block">Edit {item.name}</span>
      <MenuItemForm
        initial={item}
        categories={categories}
        submitLabel="Save changes"
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
