"use client";

import { formatCurrency } from "@/lib/format";
import { entryUnitPrice, resolveOptionLabels, type CartEntry } from "@/lib/cart";
import type { MenuItem } from "@/lib/types";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function CartView({
  entries,
  menuById,
  onQty,
  onRemove,
  note,
  onNoteChange,
  onBackToMenu,
}: {
  entries: CartEntry[];
  menuById: Map<string, MenuItem>;
  onQty: (localId: string, qty: number) => void;
  onRemove: (localId: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  onBackToMenu: () => void;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        glyph="▤"
        title="Nothing in this basket yet"
        body="Add something from the menu and it shows up here."
        action={
          <Button size="sm" variant="secondary" onClick={onBackToMenu}>
            Back to the menu
          </Button>
        }
        className="mt-6"
      />
    );
  }

  return (
    <div className="grid gap-1">
      {entries.map((entry) => {
        const item = menuById.get(entry.menuItemId);
        if (!item) return null;
        const unit = entryUnitPrice(item, entry.selectedChoiceIds);
        const options = resolveOptionLabels(item, entry.selectedChoiceIds);
        return (
          <div key={entry.localId} className="flex items-center gap-3 border-b border-border py-4 last:border-b-0">
            <div className="min-w-0 flex-1">
              <span className="t-title-sm block truncate">{item.name}</span>
              {options.length > 0 && (
                <span className="t-body-sm block truncate text-text-muted">{options.map((o) => o.label).join(", ")}</span>
              )}
              {entry.lineNote && <span className="t-body-sm block truncate italic text-text-faint">"{entry.lineNote}"</span>}
              <span className="t-mono mt-1 block text-[15px]">{formatCurrency(unit * entry.qty)}</span>
            </div>
            <QuantityStepper
              value={entry.qty}
              min={0}
              onChange={(next) => (next <= 0 ? onRemove(entry.localId) : onQty(entry.localId, next))}
            />
          </div>
        );
      })}

      <div className="grid gap-2 pt-4">
        <label htmlFor="order-note" className="t-overline text-text-faint">
          Anything else for the kitchen?
        </label>
        <textarea
          id="order-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Optional — e.g. bringing a birthday cake, please space out the plates"
          rows={2}
          className="t-body-sm resize-none rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-text-faint focus:border-accent"
        />
      </div>
    </div>
  );
}
