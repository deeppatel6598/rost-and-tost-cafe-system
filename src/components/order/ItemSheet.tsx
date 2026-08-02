"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { VegMark } from "@/components/ui/VegMark";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { formatCurrency } from "@/lib/format";
import { entryUnitPrice, requiredGroupsSatisfied } from "@/lib/cart";
import type { MenuItem } from "@/lib/types";

export function ItemSheet({
  item,
  open,
  onClose,
  onAdd,
}: {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAdd: (qty: number, selectedChoiceIds: { groupId: string; choiceId: string }[], note?: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<{ groupId: string; choiceId: string }[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open && item) {
      setQty(1);
      setNote("");
      setSelected(
        item.optionGroups
          .filter((g) => g.type === "single" && g.required && g.choices[0])
          .map((g) => ({ groupId: g.id, choiceId: g.choices[0].id })),
      );
    }
  }, [open, item]);

  if (!item) return null;

  const soldOut = !item.available;
  const unitPrice = entryUnitPrice(item, selected);
  const canAdd = !soldOut && requiredGroupsSatisfied(item, selected);

  function toggleSingle(groupId: string, choiceId: string) {
    setSelected((prev) => [...prev.filter((s) => s.groupId !== groupId), { groupId, choiceId }]);
  }

  function toggleMulti(groupId: string, choiceId: string) {
    setSelected((prev) => {
      const exists = prev.some((s) => s.groupId === groupId && s.choiceId === choiceId);
      if (exists) return prev.filter((s) => !(s.groupId === groupId && s.choiceId === choiceId));
      return [...prev, { groupId, choiceId }];
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
            onAdd(qty, selected, note.trim() || undefined);
            onClose();
          }}
        >
          {soldOut ? "Sold out right now" : `Add to order · ${formatCurrency(unitPrice * qty)}`}
        </Button>
      }
    >
      <div className="grid gap-5">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <PlaceholderImage
            photoUrl={item.photoUrl}
            itemId={item.id}
            categoryId={item.categoryId}
            alt={item.name}
            rounded="rounded-xl"
          />
        </div>

        <div className="flex items-center gap-3">
          <VegMark type={item.veg} withLabel />
          <span className="t-display-xs ml-auto">{formatCurrency(unitPrice)}</span>
        </div>

        <p className="t-body text-text-body">{item.description}</p>

        {soldOut && (
          <p className="t-body-sm rounded-md bg-status-cancelled-bg px-3 py-2 text-status-cancelled-ink">
            This item is sold out right now — it'll be back on the menu once the kitchen restocks it.
          </p>
        )}

        {item.optionGroups.map((group) => (
          <fieldset key={group.id} className="grid gap-2">
            <legend className="t-overline mb-1 text-text-faint">
              {group.name}
              {group.required && <span className="text-accent"> · required</span>}
            </legend>
            {group.choices.map((choice) => {
              const checked = selected.some((s) => s.groupId === group.id && s.choiceId === choice.id);
              return (
                <label
                  key={choice.id}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2.5 has-[:checked]:border-accent has-[:checked]:bg-accent-tint"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type={group.type === "single" ? "radio" : "checkbox"}
                      name={group.id}
                      checked={checked}
                      disabled={soldOut}
                      onChange={() => (group.type === "single" ? toggleSingle(group.id, choice.id) : toggleMulti(group.id, choice.id))}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span className="t-body-sm">{choice.label}</span>
                  </span>
                  {choice.priceDelta > 0 && <span className="t-mono text-xs text-text-muted">+{formatCurrency(choice.priceDelta)}</span>}
                </label>
              );
            })}
          </fieldset>
        ))}

        <div className="grid gap-2">
          <label htmlFor="line-note" className="t-overline text-text-faint">
            Special instructions
          </label>
          <textarea
            id="line-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. no onion, extra spicy, one warmed"
            rows={2}
            disabled={soldOut}
            className="t-body-sm resize-none rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-text-faint focus:border-accent"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="t-title-sm">Quantity</span>
          <QuantityStepper value={qty} min={1} onChange={setQty} />
        </div>
      </div>
    </BottomSheet>
  );
}
