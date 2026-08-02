"use client";

import { useState } from "react";
import { generateId } from "@/lib/format";
import type { Category, ItemOptionGroup, MenuItem, VegMark as VegMarkType } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

export type MenuItemFormValues = Omit<MenuItem, "id" | "createdAt" | "updatedAt">;

const VEG_OPTIONS: { value: VegMarkType; label: string }[] = [
  { value: "veg", label: "Vegetarian" },
  { value: "egg", label: "Contains egg" },
  { value: "nonveg", label: "Non-vegetarian" },
];

export function MenuItemForm({
  initial,
  categories,
  submitLabel,
  onSubmit,
  submitting,
}: {
  initial?: MenuItem;
  categories: Category[];
  submitLabel: string;
  onSubmit: (values: MenuItemFormValues) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [veg, setVeg] = useState<VegMarkType>(initial?.veg ?? "veg");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [groups, setGroups] = useState<ItemOptionGroup[]>(initial?.optionGroups ?? []);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  function addGroup() {
    setGroups((prev) => [
      ...prev,
      { id: generateId("group"), name: "", type: "single", required: false, choices: [{ id: generateId("choice"), label: "", priceDelta: 0 }] },
    ]);
  }

  function updateGroup(id: string, patch: Partial<ItemOptionGroup>) {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function removeGroup(id: string) {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  function addChoice(groupId: string) {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, choices: [...g.choices, { id: generateId("choice"), label: "", priceDelta: 0 }] } : g)),
    );
  }

  function updateChoice(groupId: string, choiceId: string, patch: Partial<ItemOptionGroup["choices"][number]>) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, choices: g.choices.map((c) => (c.id === choiceId ? { ...c, ...patch } : c)) } : g,
      ),
    );
  }

  function removeChoice(groupId: string, choiceId: string) {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, choices: g.choices.filter((c) => c.id !== choiceId) } : g)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      categoryId,
      veg,
      photoUrl: photoUrl.trim() || undefined,
      badge: badge.trim() || undefined,
      available,
      optionGroups: groups
        .filter((g) => g.name.trim())
        .map((g) => ({ ...g, choices: g.choices.filter((c) => c.label.trim()) })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-6">
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-lg">
          <PlaceholderImage photoUrl={photoUrl || undefined} icon={selectedCategory?.icon ?? "desserts"} alt={name || "New item"} />
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="t-overline text-text-faint">Photo URL</span>
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://…"
              className="h-11 rounded-md border border-border bg-surface px-3"
            />
            <span className="t-caption text-text-faint">
              No file storage yet — paste an image URL for now. Direct upload plugs in once a database is connected.
            </span>
          </label>
        </div>
      </div>

      <label className="grid gap-1.5">
        <span className="t-overline text-text-faint">Name</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-md border border-border bg-surface px-3" />
      </label>

      <label className="grid gap-1.5">
        <span className="t-overline text-text-faint">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="resize-none rounded-md border border-border bg-surface px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1.5">
          <span className="t-overline text-text-faint">Price (₹)</span>
          <input
            required
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-11 rounded-md border border-border bg-surface px-3"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="t-overline text-text-faint">Category</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-11 rounded-md border border-border bg-surface px-3">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="t-overline text-text-faint">Badge (optional)</span>
          <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. Favourite" className="h-11 rounded-md border border-border bg-surface px-3" />
        </label>
      </div>

      <div className="grid gap-1.5">
        <span className="t-overline text-text-faint">Veg / non-veg mark</span>
        <div className="flex flex-wrap gap-2">
          {VEG_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 has-[:checked]:border-accent has-[:checked]:bg-accent-tint"
            >
              <input type="radio" name="veg" checked={veg === opt.value} onChange={() => setVeg(opt.value)} />
              <span className="t-body-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
        <span className="t-title-sm">Available on the menu</span>
        <ToggleSwitch checked={available} onChange={setAvailable} label="Available" />
      </div>

      <div className="grid gap-3">
        <div className="flex items-center gap-3">
          <span className="t-title-md">Options &amp; add-ons</span>
          <Button type="button" size="sm" variant="secondary" onClick={addGroup}>
            Add group
          </Button>
        </div>
        {groups.length === 0 && <p className="t-body-sm text-text-muted">None — this item has no size or add-on choices.</p>}
        {groups.map((group) => (
          <div key={group.id} className="grid gap-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={group.name}
                onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                placeholder="Group name — e.g. Size"
                className="h-10 flex-1 rounded-md border border-border bg-surface px-3"
              />
              <select
                value={group.type}
                onChange={(e) => updateGroup(group.id, { type: e.target.value as "single" | "multi" })}
                className="h-10 rounded-md border border-border bg-surface px-2"
              >
                <option value="single">Pick one</option>
                <option value="multi">Pick any</option>
              </select>
              <label className="flex items-center gap-1.5 t-body-sm">
                <input type="checkbox" checked={!!group.required} onChange={(e) => updateGroup(group.id, { required: e.target.checked })} />
                Required
              </label>
              <button type="button" onClick={() => removeGroup(group.id)} className="t-body-sm text-danger">
                Remove group
              </button>
            </div>
            <div className="grid gap-2">
              {group.choices.map((choice) => (
                <div key={choice.id} className="flex items-center gap-2">
                  <input
                    value={choice.label}
                    onChange={(e) => updateChoice(group.id, choice.id, { label: e.target.value })}
                    placeholder="Choice — e.g. Large"
                    className="h-10 flex-1 rounded-md border border-border bg-surface px-3"
                  />
                  <input
                    type="number"
                    value={choice.priceDelta}
                    onChange={(e) => updateChoice(group.id, choice.id, { priceDelta: Number(e.target.value) || 0 })}
                    placeholder="+₹"
                    className="h-10 w-24 rounded-md border border-border bg-surface px-3"
                  />
                  <button type="button" onClick={() => removeChoice(group.id, choice.id)} className="t-caption text-text-faint hover:text-danger">
                    ✕
                  </button>
                </div>
              ))}
              <Button type="button" size="sm" variant="ghost" onClick={() => addChoice(group.id)} className="justify-self-start">
                + Add choice
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" size="admin" disabled={submitting} className="justify-self-start">
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
