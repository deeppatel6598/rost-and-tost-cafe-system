"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuCategory } from "@/lib/types";
import { MenuItemForm, type MenuItemFormValues } from "@/components/admin/MenuItemForm";
import { useToast } from "@/components/ui/Toast";

export default function NewMenuItemPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/menu")
      .then((r) => (r.ok ? r.json() : { categories: [] }))
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  async function handleSubmit(values: MenuItemFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Added ${values.name}`, "success");
      router.push("/admin/menu");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  if (categories.length === 0) return null;

  return (
    <div className="px-4 py-5">
      <span className="t-display-sm mb-5 block">Add menu item</span>
      <MenuItemForm
        categories={categories}
        submitLabel="Add item"
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
