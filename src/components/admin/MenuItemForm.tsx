"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import type { FoodType, ItemVariant, MenuCategory, MenuItemView } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { FoodArt, artKeyFor, asArtKey } from "@/components/ui/FoodArt";

export interface MenuItemFormValues {
  name: string;
  description: string;
  basePrice: number;
  categoryId: string;
  foodType: FoodType;
  imageUrl?: string;
  isAvailable: boolean;
  variants: Omit<ItemVariant, "itemId">[];
  addonGroups: {
    id: string;
    name: string;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    sortOrder: number;
    addons: { id: string; name: string; priceDelta: number; isAvailable: boolean }[];
  }[];
}

const FOOD_TYPES: { value: FoodType; label: string }[] = [
  { value: "veg", label: "Veg" },
  { value: "jain", label: "Jain" },
  { value: "egg", label: "Egg" },
  { value: "non_veg", label: "Non-veg" },
];

let tempId = 0;
const nextTempId = (prefix: string) => `${prefix}_new_${++tempId}`;

export function MenuItemForm({
  initial,
  categories,
  submitLabel,
  submitting,
  onSubmit,
}: {
  initial?: MenuItemView;
  categories: MenuCategory[];
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: MenuItemFormValues) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [basePrice, setBasePrice] = useState(initial ? String(initial.basePrice) : "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [foodType, setFoodType] = useState<FoodType>(initial?.foodType ?? "veg");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [isAvailable, setIsAvailable] = useState(initial?.isAvailable ?? true);
  const [variants, setVariants] = useState<MenuItemFormValues["variants"]>(
    initial?.variants.map((v) => ({ ...v })) ?? [],
  );
  const [groups, setGroups] = useState<MenuItemFormValues["addonGroups"]>(
    initial?.addonGroups.map((g) => ({
      id: g.id,
      name: g.name,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      isRequired: g.isRequired,
      sortOrder: g.sortOrder,
      addons: g.addons.map((a) => ({ id: a.id, name: a.name, priceDelta: a.priceDelta, isAvailable: a.isAvailable })),
    })) ?? [],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      basePrice: Number(basePrice) || 0,
      categoryId,
      foodType,
      imageUrl: imageUrl.trim() || undefined,
      isAvailable,
      variants: variants.filter((v) => v.name.trim()),
      addonGroups: groups
        .filter((g) => g.name.trim())
        .map((g) => ({ ...g, addons: g.addons.filter((a) => a.name.trim()) })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-6">
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <div className="aspect-square overflow-hidden rounded-lg">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <FoodArt art={initial?.art ? asArtKey(initial.art) : artKeyFor(initial?.id ?? "", categoryId)} />
          )}
        </div>
        <label className="grid content-start gap-1.5">
          <span className="t-overline text-text-faint">Photo URL</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="h-11 rounded-md border border-border bg-surface px-3"
          />
          <span className="t-caption text-text-faint">
            Paste an image link for now. Direct upload arrives with file storage.
          </span>
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="t-overline text-text-faint">Name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="h-12 rounded-md border border-border bg-surface px-3"
        />
      </label>

      <label className="grid gap-1.5">
        <span className="t-overline text-text-faint">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={200}
          className="resize-none rounded-md border border-border bg-surface px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="t-overline text-text-faint">Price (₹)</span>
          <input
            required
            type="number"
            min={0}
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="h-12 rounded-md border border-border bg-surface px-3"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="t-overline text-text-faint">Category</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-12 rounded-md border border-border bg-surface px-3"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-1.5">
        <span className="t-overline text-text-faint">Food type</span>
        <div className="flex flex-wrap gap-2">
          {FOOD_TYPES.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5",
                foodType === opt.value ? "border-accent bg-accent-tint" : "border-border",
              )}
            >
              <input
                type="radio"
                name="foodType"
                checked={foodType === opt.value}
                onChange={() => setFoodType(opt.value)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className="t-body-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
        <span className="t-title-sm">Available on the menu</span>
        <ToggleSwitch checked={isAvailable} onChange={setIsAvailable} label="Available" />
      </div>

      {/* Variants — size, half/full */}
      <section className="grid gap-3">
        <div className="flex items-center gap-3">
          <span className="t-title-md">Sizes &amp; variants</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setVariants((prev) => [
                ...prev,
                { id: nextTempId("var"), name: "", priceDelta: 0, isAvailable: true, sortOrder: prev.length },
              ])
            }
          >
            Add size
          </Button>
        </div>
        {variants.length === 0 && (
          <p className="t-body-sm text-text-muted">None — this item is sold one way only.</p>
        )}
        {variants.map((variant, index) => (
          <div key={variant.id} className="flex items-center gap-2">
            <input
              value={variant.name}
              onChange={(e) =>
                setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, name: e.target.value } : v)))
              }
              placeholder='e.g. 10" Medium'
              className="h-11 flex-1 rounded-md border border-border bg-surface px-3"
            />
            <input
              type="number"
              value={variant.priceDelta}
              onChange={(e) =>
                setVariants((prev) =>
                  prev.map((v, i) => (i === index ? { ...v, priceDelta: Number(e.target.value) || 0 } : v)),
                )
              }
              placeholder="+₹"
              className="h-11 w-24 rounded-md border border-border bg-surface px-3"
            />
            <button
              type="button"
              onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
              className="px-2 text-text-faint hover:text-danger"
              aria-label={`Remove ${variant.name || "variant"}`}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </section>

      {/* Add-on groups — extra toppings, spice level */}
      <section className="grid gap-3">
        <div className="flex items-center gap-3">
          <span className="t-title-md">Add-ons</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setGroups((prev) => [
                ...prev,
                {
                  id: nextTempId("grp"),
                  name: "",
                  minSelect: 0,
                  maxSelect: 3,
                  isRequired: false,
                  sortOrder: prev.length,
                  addons: [{ id: nextTempId("add"), name: "", priceDelta: 0, isAvailable: true }],
                },
              ])
            }
          >
            Add group
          </Button>
        </div>
        {groups.length === 0 && <p className="t-body-sm text-text-muted">None.</p>}

        {groups.map((group, gi) => (
          <div key={group.id} className="grid gap-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={group.name}
                onChange={(e) =>
                  setGroups((prev) => prev.map((g, i) => (i === gi ? { ...g, name: e.target.value } : g)))
                }
                placeholder="Group name — e.g. Extra toppings"
                className="h-11 flex-1 rounded-md border border-border bg-surface px-3"
              />
              <label className="flex items-center gap-1.5 text-[13px]">
                max
                <input
                  type="number"
                  min={1}
                  value={group.maxSelect}
                  onChange={(e) =>
                    setGroups((prev) =>
                      prev.map((g, i) => (i === gi ? { ...g, maxSelect: Number(e.target.value) || 1 } : g)),
                    )
                  }
                  className="h-11 w-16 rounded-md border border-border bg-surface px-2"
                />
              </label>
              <label className="flex items-center gap-1.5 text-[13px]">
                <input
                  type="checkbox"
                  checked={group.isRequired}
                  onChange={(e) =>
                    setGroups((prev) =>
                      prev.map((g, i) => (i === gi ? { ...g, isRequired: e.target.checked } : g)),
                    )
                  }
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                required
              </label>
              <button
                type="button"
                onClick={() => setGroups((prev) => prev.filter((_, i) => i !== gi))}
                className="t-body-sm text-danger"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-2">
              {group.addons.map((addon, ai) => (
                <div key={addon.id} className="flex items-center gap-2">
                  <input
                    value={addon.name}
                    onChange={(e) =>
                      setGroups((prev) =>
                        prev.map((g, i) =>
                          i === gi
                            ? {
                                ...g,
                                addons: g.addons.map((a, j) => (j === ai ? { ...a, name: e.target.value } : a)),
                              }
                            : g,
                        ),
                      )
                    }
                    placeholder="Choice — e.g. Extra cheese"
                    className="h-11 flex-1 rounded-md border border-border bg-surface px-3"
                  />
                  <input
                    type="number"
                    value={addon.priceDelta}
                    onChange={(e) =>
                      setGroups((prev) =>
                        prev.map((g, i) =>
                          i === gi
                            ? {
                                ...g,
                                addons: g.addons.map((a, j) =>
                                  j === ai ? { ...a, priceDelta: Number(e.target.value) || 0 } : a,
                                ),
                              }
                            : g,
                        ),
                      )
                    }
                    placeholder="+₹"
                    className="h-11 w-24 rounded-md border border-border bg-surface px-3"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setGroups((prev) =>
                        prev.map((g, i) => (i === gi ? { ...g, addons: g.addons.filter((_, j) => j !== ai) } : g)),
                      )
                    }
                    className="px-2 text-text-faint hover:text-danger"
                    aria-label="Remove choice"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="justify-self-start"
                onClick={() =>
                  setGroups((prev) =>
                    prev.map((g, i) =>
                      i === gi
                        ? {
                            ...g,
                            addons: [
                              ...g.addons,
                              { id: nextTempId("add"), name: "", priceDelta: 0, isAvailable: true },
                            ],
                          }
                        : g,
                    ),
                  )
                }
              >
                + Add choice
              </Button>
            </div>
          </div>
        ))}
      </section>

      <Button type="submit" size="admin" disabled={submitting} className="justify-self-start">
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
