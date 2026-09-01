"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  tagline: string;
  art: string;
  availability: StallAvailability;
}

/**
 * Stall selection.
 *
 * Each stall gets a full-bleed colour-blocked card in its own brand colour,
 * because these are four separate businesses and should not read as four rows
 * of one list. The two-tone title (name bold, category soft) and the circled
 * arrow give each card a single obvious action, which is what makes it
 * tappable at a glance rather than something to read first.
 */
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

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-5">
        <h1 className="t-display-md mb-1 leading-[1.1]">
          What are you
          <br />
          eating today?
        </h1>
        <p className="t-body-sm mb-5 text-text-muted">
          Four kitchens, four bills. Pick one to start — you can order from another straight after.
        </p>

        <div className="grid gap-4">
          {stalls.map((stall) => {
            const open = stall.availability.canOrder;
            return (
              <button
                key={stall.id}
                type="button"
                data-stall={stall.id}
                disabled={!open}
                onClick={() => openStall(stall.id)}
                aria-label={`${stall.name}. ${stall.availability.label}`}
                className={cn(
                  "group relative isolate flex h-[168px] w-full overflow-hidden rounded-card-lg text-left",
                  "transition-transform duration-base active:scale-[0.985]",
                  open ? "u-brand-grad u-lift-2" : "bg-surface-raised",
                )}
              >
                {/* Artwork bleeds off the right edge, like the reference cards. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -right-6 top-1/2 h-[150px] w-[150px] -translate-y-1/2 rotate-[-8deg]",
                    !open && "opacity-40 grayscale",
                  )}
                >
                  {/* Bare artwork: on a brand-coloured card, the illustration's
                      own backdrop would read as a box inside a box. */}
                  <span className="block h-full w-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
                    <FoodArt art={asArtKey(stall.art)} bare />
                  </span>
                </span>

                <span className="relative z-10 flex w-[62%] flex-col justify-between p-5">
                  <span>
                    <span
                      className={cn(
                        "t-display-xs block leading-tight",
                        open ? "text-brand-ink" : "text-text",
                      )}
                    >
                      {stall.name}
                    </span>
                    <span
                      className={cn(
                        "t-body-sm mt-1 block leading-snug",
                        open ? "text-brand-ink/75" : "text-text-muted",
                      )}
                    >
                      {stall.tagline}
                    </span>
                  </span>

                  {open ? (
                    <span className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[15px] font-bold text-brand-700">
                        ↗
                      </span>
                      <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-brand-ink">
                        View menu
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex h-8 w-max items-center rounded-pill bg-status-cancelled-bg px-3 text-[12px] font-semibold text-status-cancelled-ink">
                      {stall.availability.label}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <p className="t-caption mt-6 text-center text-text-faint">
          Each stall is billed separately · pay that stall at its own counter
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
