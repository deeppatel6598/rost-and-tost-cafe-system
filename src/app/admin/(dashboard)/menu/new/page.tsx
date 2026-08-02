"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";
import { MenuItemForm, type MenuItemFormValues } from "@/components/admin/MenuItemForm";
import { useToast } from "@/components/ui/Toast";

export default function NewMenuItemPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories));
  }, []);

  async function handleSubmit(values: MenuItemFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Added ${values.name}`, "success");
      router.push("/admin/menu");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save item.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  if (categories.length === 0) return null;

  return (
    <div className="px-[var(--gutter-admin)] py-5">
      <span className="t-display-sm mb-5 block">Add menu item</span>
      <MenuItemForm categories={categories} submitLabel="Add item" onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
