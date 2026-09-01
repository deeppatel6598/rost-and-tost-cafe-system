"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import type { MenuItemView } from "@/lib/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { VegMark } from "@/components/ui/VegMark";
import { ItemArt } from "@/components/order/menu/shared";

/** Size, half/full, extra toppings, spice level — chosen before adding to cart. */
export function ItemSheet({
  item,
  stallId,
  canOrder,
  open,
  onClose,
  onAdded,
}: {
  item: MenuItemView | null;
  stallId: string;
  canOrder: boolean;
  open: boolean;
  onClose: () => void;
  onAdded: (name: string) => void;
}) {
  const cart = useCart();
  const [variantId, setVariantId] = useState<string | undefined>();
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!open || !item) return;
    setQuantity(1);
    setAddonIds([]);
    // Default to the first available variant so a required choice is never
    // silently unmet.
    setVariantId(item.variants.find((v) => v.isAvailable)?.id);
  }, [open, item]);

  if (!item) return null;

  const soldOut = !item.isAvailable;
  const variant = item.variants.find((v) => v.id === variantId);
  const chosenAddons = item.addonGroups.flatMap((g) => g.addons).filter((a) => addonIds.includes(a.id));
  const unitPrice =
    item.basePrice + (variant?.priceDelta ?? 0) + chosenAddons.reduce((sum, a) => sum + a.priceDelta, 0);

  const unmetGroup = item.addonGroups.find((group) => {
    const chosen = addonIds.filter((id) => group.addons.some((a) => a.id === id)).length;
    const min = group.isRequired ? Math.max(1, group.minSelect) : group.minSelect;
    return chosen < min;
  });
  const needsVariant = item.variants.length > 0 && !variantId;
  const canAdd = canOrder && !soldOut && !unmetGroup && !needsVariant;

  function toggleAddon(groupId: string, addonId: string, maxSelect: number) {
    setAddonIds((prev) => {
      const group = item!.addonGroups.find((g) => g.id === groupId);
      const inGroup = prev.filter((id) => group?.addons.some((a) => a.id === id));
      const isSelected = prev.includes(addonId);

      if (isSelected) return prev.filter((id) => id !== addonId);

      // A "pick one" group swaps rather than accumulates.
      if (maxSelect === 1) {
        return [...prev.filter((id) => !inGroup.includes(id)), addonId];
      }
      if (inGroup.length >= maxSelect) return prev;
      return [...prev, addonId];
    });
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={item.name}
      footer={
        <Button
          size="hero"
          fullWidth
          disabled={!canAdd}
          onClick={() => {
            cart.addLine(stallId, item, variantId, addonIds, quantity);
            onAdded(item.name);
            onClose();
          }}
        >
          {soldOut
            ? "Sold out"
            : !canOrder
              ? "Stall is closed"
              : unmetGroup
                ? `Choose ${unmetGroup.name.toLowerCase()}`
                : `Add to cart · ${formatCurrency(unitPrice * quantity)}`}
        </Button>
      }
    >
      <div className="grid gap-5">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl u-photo-plate">
          <ItemArt item={item} rounded="rounded-xl" />
        </div>

        <div className="flex items-center gap-3">
          <VegMark type={item.foodType} withLabel />
          <span className="t-display-xs ml-auto">{formatCurrency(unitPrice)}</span>
        </div>

        {item.description && <p className="t-body text-text-body">{item.description}</p>}

        {soldOut && (
          <p className="t-body-sm rounded-md bg-status-cancelled-bg px-3 py-2 text-status-cancelled-ink">
            This is sold out right now. The stall will switch it back on when it&apos;s available again.
          </p>
        )}

        {item.variants.length > 0 && (
          <fieldset className="grid gap-2">
            <legend className="t-overline mb-1 text-text-faint">
              Choose one <span className="text-accent">· required</span>
            </legend>
            {item.variants.map((v) => (
              <label
                key={v.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2.5",
                  variantId === v.id ? "border-accent bg-accent-tint" : "border-border",
                  !v.isAvailable && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="variant"
                    checked={variantId === v.id}
                    disabled={!v.isAvailable || soldOut}
                    onChange={() => setVariantId(v.id)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span className="t-body-sm">{v.name}</span>
                </span>
                <span className="t-mono text-xs text-text-muted">
                  {v.priceDelta > 0 ? `+${formatCurrency(v.priceDelta)}` : "—"}
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {item.addonGroups.map((group) => {
          const chosenInGroup = addonIds.filter((id) => group.addons.some((a) => a.id === id)).length;
          return (
            <fieldset key={group.id} className="grid gap-2">
              <legend className="t-overline mb-1 text-text-faint">
                {group.name}
                {group.isRequired ? (
                  <span className="text-accent"> · required</span>
                ) : group.maxSelect > 1 ? (
                  <span> · up to {group.maxSelect}</span>
                ) : null}
              </legend>
              {group.addons.map((addon) => {
                const checked = addonIds.includes(addon.id);
                const atLimit = !checked && group.maxSelect > 1 && chosenInGroup >= group.maxSelect;
                return (
                  <label
                    key={addon.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2.5",
                      checked ? "border-accent bg-accent-tint" : "border-border",
                      (!addon.isAvailable || atLimit) && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type={group.maxSelect === 1 ? "radio" : "checkbox"}
                        name={group.id}
                        checked={checked}
                        disabled={!addon.isAvailable || soldOut || atLimit}
                        onChange={() => toggleAddon(group.id, addon.id, group.maxSelect)}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      <span className="t-body-sm">{addon.name}</span>
                    </span>
                    {addon.priceDelta > 0 && (
                      <span className="t-mono text-xs text-text-muted">+{formatCurrency(addon.priceDelta)}</span>
                    )}
                  </label>
                );
              })}
            </fieldset>
          );
        })}

        <div className="flex items-center justify-between">
          <span className="t-title-sm">Quantity</span>
          <QuantityStepper value={quantity} min={1} max={20} onChange={setQuantity} />
        </div>
      </div>
    </BottomSheet>
  );
}
