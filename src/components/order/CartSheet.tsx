"use client";

import { formatCurrency } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import type { StallView } from "@/lib/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";

export function CartSheet({
  open,
  onClose,
  stall,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  stall: StallView;
  onCheckout: () => void;
}) {
  const cart = useCart();
  const lines = cart.stallId === stall.id ? cart.lines : [];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`Your cart · ${stall.name}`}
      footer={
        <Button
          size="hero"
          fullWidth
          disabled={lines.length === 0 || !stall.availability.canOrder}
          onClick={onCheckout}
        >
          {stall.availability.canOrder
            ? `Checkout · ${formatCurrency(cart.displayTotal)}`
            : "Stall is closed"}
        </Button>
      }
    >
      {lines.length === 0 ? (
        <p className="t-body-sm py-6 text-center text-text-muted">
          Nothing here yet. Add something from the menu.
        </p>
      ) : (
        <div className="grid gap-1">
          {lines.map((line) => (
            <div key={line.lineId} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <span className="t-title-sm block truncate">{line.name}</span>
                {(line.variantName || line.addonNames.length > 0) && (
                  <span className="t-body-sm block truncate text-text-muted">
                    {[line.variantName, ...line.addonNames].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="t-mono mt-0.5 block text-[15px]">
                  {formatCurrency(line.unitPrice * line.quantity)}
                </span>
              </div>
              <QuantityStepper
                value={line.quantity}
                min={0}
                max={20}
                onChange={(next) => cart.setQuantity(line.lineId, next)}
              />
            </div>
          ))}

          <div className="mt-3 grid gap-1.5 border-t border-border pt-3">
            <div className="flex justify-between text-[15px] font-semibold">
              <span>Total</span>
              <span className="t-mono">{formatCurrency(cart.displayTotal)}</span>
            </div>
            <p className="t-caption text-text-faint">
              Confirmed at checkout — the stall&apos;s live prices always win.
            </p>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
