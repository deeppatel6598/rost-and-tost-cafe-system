"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { useCart } from "@/context/CartContext";
import { FoodArt, asArtKey } from "@/components/ui/FoodArt";
import { GuestHeader } from "@/components/order/GuestHeader";
import { MyOrdersLink } from "@/components/order/MyOrdersLink";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { StallAvailability } from "@/lib/types";

interface StallCard {
  id: string;
  name: string;
  description: string;
  art: string;
  availability: StallAvailability;
}

export function StallPicker({ tableNumber, stalls }: { tableNumber: number; stalls: StallCard[] }) {
  const router = useRouter();
  const cart = useCart();
  const [pendingStallId, setPendingStallId] = useState<string | null>(null);

  function openStall(stallId: string) {
    // A cart holds one stall's items. Warn before throwing away a part-built
    // order rather than silently emptying it.
    if (cart.stallId && cart.stallId !== stallId && cart.itemCount > 0) {
      setPendingStallId(stallId);
      return;
    }
    router.push(`/order/${stallId}`);
  }

  const pendingStall = stalls.find((s) => s.id === pendingStallId);

  return (
    <>
      <GuestHeader tableNumber={tableNumber} right={<MyOrdersLink />} />

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
        <h1 className="t-display-sm mb-1">Where are you eating from?</h1>
        <p className="t-body-sm mb-5 text-text-muted">
          Four stalls, each with its own kitchen and its own bill. Pick one to start — you can order from another
          straight afterwards.
        </p>

        <div className="grid gap-3">
          {stalls.map((stall) => {
            const open = stall.availability.canOrder;
            return (
              <button
                key={stall.id}
                type="button"
                disabled={!open}
                onClick={() => openStall(stall.id)}
                aria-label={`${stall.name}. ${open ? stall.availability.label : stall.availability.label}`}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-3 text-left transition-colors",
                  open
                    ? "border-border bg-surface active:border-accent"
                    : "cursor-not-allowed border-border bg-surface opacity-55",
                )}
              >
                <span className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                  <FoodArt art={asArtKey(stall.art)} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="t-title-md block truncate">{stall.name}</span>
                  <span className="t-body-sm mt-0.5 block text-text-muted">{stall.description}</span>
                  <span
                    className={cn(
                      "mt-2 inline-flex h-6 items-center rounded-pill px-2.5 text-[11px] font-semibold",
                      open
                        ? "bg-status-served-bg text-status-served-ink"
                        : "bg-status-cancelled-bg text-status-cancelled-ink",
                    )}
                  >
                    {stall.availability.label}
                  </span>
                </span>
                {open && (
                  <span aria-hidden="true" className="shrink-0 text-text-faint">
                    ›
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="t-caption mt-6 text-center text-text-faint">
          Each stall is billed separately. Pay that stall at its own counter.
        </p>
      </div>

      <BottomSheet
        open={pendingStallId !== null}
        onClose={() => setPendingStallId(null)}
        title="Start a new cart?"
        footer={
          <div className="grid gap-2">
            <Button
              size="hero"
              fullWidth
              onClick={() => {
                cart.clear();
                const target = pendingStallId;
                setPendingStallId(null);
                if (target) router.push(`/order/${target}`);
              }}
            >
              Clear cart and switch
            </Button>
            <Button variant="ghost" size="guest" fullWidth onClick={() => setPendingStallId(null)}>
              Keep my current cart
            </Button>
          </div>
        }
      >
        <p className="t-body text-text-body">
          Your cart has {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"} from another stall. Each stall takes
          its own payment, so a cart can only hold one stall&apos;s food.
        </p>
        <p className="t-body-sm mt-3 text-text-muted">
          Switching to {pendingStall?.name} will empty the current cart. To order from both, place this order first
          and then come back.
        </p>
      </BottomSheet>
    </>
  );
}
