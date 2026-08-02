"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Category, MenuItem } from "@/lib/types";
import { MenuItemForm, type MenuItemFormValues } from "@/components/admin/MenuItemForm";
import { useToast } from "@/components/ui/Toast";

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [item, setItem] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/menu/${params.id}`).then((r) => r.json().then((d) => ({ ok: r.ok, d }))),
    ]).then(([catData, { ok, d }]) => {
      setCategories(catData.categories);
      if (ok) setItem(d.item);
      else setNotFound(true);
    });
  }, [params.id]);

  async function handleSubmit(values: MenuItemFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/menu/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Saved ${values.name}`, "success");
      router.push("/admin/menu");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save item.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) return <p className="px-[var(--gutter-admin)] py-5">Item not found.</p>;
  if (!item || categories.length === 0) return null;

  return (
    <div className="px-[var(--gutter-admin)] py-5">
      <span className="t-display-sm mb-5 block">Edit {item.name}</span>
      <MenuItemForm initial={item} categories={categories} submitLabel="Save changes" onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
