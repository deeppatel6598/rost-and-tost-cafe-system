"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

const CARD_SPACING = 128;
const DISTANCE_THRESHOLD = 0.32;
const VELOCITY_THRESHOLD = 480;

/**
 * Discoverability choice: with 3 of 7+ categories visible at once, guests
 * need a cheap way to know "how many more, and where am I." We use position
 * dots (one per category, current one filled) rather than a peek-count badge
 * or an expand-to-grid button — dots are the smallest, most familiar signal
 * for a 5-10 item carousel, read at a glance, and don't compete for space
 * with the collapsed sticky strip. An expand-to-grid control would earn its
 * keep once the category list grows past ~12; not needed here.
 */
export function CategoryCarousel({
  categories,
  selectedId,
  onSelect,
  soldOutIds,
  collapsed,
}: {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  soldOutIds?: Set<string>;
  collapsed?: boolean;
}) {
  const length = categories.length;
  const selectedIndex = Math.max(0, categories.findIndex((c) => c.id === selectedId));
  const prefersReducedMotion = useReducedMotion();
  const [dragPhase, setDragPhase] = useState(0);
  const [dragging, setDragging] = useState(false);
  const liveRef = useRef<HTMLDivElement>(null);

  const announce = useCallback(
    (index: number) => {
      const cat = categories[index];
      if (!cat || !liveRef.current) return;
      const soldOut = soldOutIds?.has(cat.id) ? ", all sold out" : "";
      liveRef.current.textContent = `${cat.name}, category ${index + 1} of ${length}${soldOut}, selected`;
    },
    [categories, length, soldOutIds],
  );

  const vibrate = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        /* no-op: haptics are a nicety, never a requirement */
      }
    }
  }, []);

  const moveBy = useCallback(
    (delta: number) => {
      const nextIndex = ((selectedIndex + delta) % length + length) % length;
      onSelect(categories[nextIndex].id);
      vibrate();
      announce(nextIndex);
    },
    [selectedIndex, length, categories, onSelect, vibrate, announce],
  );

  const selectIndex = useCallback(
    (index: number) => {
      onSelect(categories[index].id);
      vibrate();
      announce(index);
    },
    [categories, onSelect, vibrate, announce],
  );

  function handleDrag(_: unknown, info: PanInfo) {
    if (prefersReducedMotion) return;
    setDragging(true);
    const phase = -info.offset.x / CARD_SPACING;
    setDragPhase(Math.max(-1.6, Math.min(1.6, phase)));
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    setDragging(false);
    let delta = 0;
    if (prefersReducedMotion) {
      if (info.offset.x < -40) delta = 1;
      else if (info.offset.x > 40) delta = -1;
    } else if (Math.abs(dragPhase) > DISTANCE_THRESHOLD) {
      delta = dragPhase > 0 ? 1 : -1;
    } else if (Math.abs(info.velocity.x) > VELOCITY_THRESHOLD) {
      delta = info.velocity.x < 0 ? 1 : -1;
    }
    setDragPhase(0);
    if (delta !== 0) moveBy(delta);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveBy(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveBy(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      selectIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      selectIndex(length - 1);
    }
  }

  if (collapsed) {
    return (
      <div
        role="tablist"
        aria-label="Menu categories"
        onKeyDown={handleKeyDown}
        className="no-scrollbar flex animate-rt-fade gap-2 overflow-x-auto px-[var(--gutter-guest)] py-2"
      >
        {categories.map((cat, i) => {
          const active = cat.id === selectedId;
          const allSoldOut = soldOutIds?.has(cat.id);
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={active}
              aria-label={`${cat.name}, category ${i + 1} of ${length}${allSoldOut ? ", all sold out" : ""}`}
              tabIndex={active ? 0 : -1}
              onClick={() => selectIndex(i)}
              className={cn(
                "h-9 shrink-0 whitespace-nowrap rounded-pill border px-4 text-sm font-semibold transition-colors duration-base",
                active
                  ? "border-accent bg-accent-tint text-accent"
                  : "border-border text-text-muted hover:text-text",
                allSoldOut && !active && "opacity-60",
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative select-none">
      <div ref={liveRef} className="u-sr-only" aria-live="polite" />
      <div
        role="tablist"
        aria-label="Menu categories"
        onKeyDown={handleKeyDown}
        className="relative h-[164px] touch-pan-y overflow-hidden"
      >
        {/* Invisible full-width drag catcher — constrained to (0,0) so it never
            visually moves; PanInfo.offset still reports true pointer travel,
            which is what drives the card transforms below. */}
        <motion.div
          className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        />
        {categories.map((cat, i) => {
          let raw = i - selectedIndex;
          if (raw > length / 2) raw -= length;
          if (raw < -length / 2) raw += length;
          const effective = dragging || dragPhase !== 0 ? raw - dragPhase : raw;
          const d = Math.abs(effective);
          const visible = d < 2.4;
          const scale = Math.max(0.46, 1 - 0.32 * d);
          const opacity = d <= 1 ? 1 - 0.5 * d : Math.max(0, 0.5 - 0.5 * (d - 1));
          const raise = Math.max(0, 1 - d) * 8;
          const allSoldOut = soldOutIds?.has(cat.id);
          const isCenter = d < 0.05;

          return (
            <motion.button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isCenter}
              aria-label={`${cat.name}, category ${i + 1} of ${length}${allSoldOut ? ", all sold out" : ""}`}
              tabIndex={isCenter ? 0 : -1}
              onClick={() => (isCenter ? undefined : selectIndex(i))}
              className={cn(
                "absolute left-1/2 top-2 flex w-[104px] -translate-x-1/2 flex-col items-center gap-2",
                !visible && "pointer-events-none",
                d > 1.05 && "pointer-events-none",
              )}
              style={{ zIndex: Math.round(100 - d * 10) }}
              animate={{
                x: effective * CARD_SPACING,
                scale,
                opacity: visible ? opacity : 0,
                y: -raise,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : dragging
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 340, damping: 32 }
              }
            >
              <span
                className={cn(
                  "relative aspect-square w-full overflow-hidden rounded-xl border-2 transition-colors duration-base",
                  isCenter ? "border-accent shadow-2" : "border-transparent",
                )}
              >
                <PlaceholderImage photoUrl={cat.photoUrl} icon={cat.icon} alt={cat.name} rounded="rounded-xl" />
                {allSoldOut && (
                  <span className="absolute inset-x-0 bottom-0 bg-roast-950/80 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-on-dark-soft">
                    Sold out
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "t-caption truncate",
                  isCenter ? "font-semibold text-text" : "text-text-muted",
                )}
              >
                {cat.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-1" aria-hidden="true">
        {categories.map((cat, i) => (
          <span
            key={cat.id}
            className={cn(
              "h-1.5 rounded-pill transition-all duration-base",
              cat.id === selectedId ? "w-4 bg-accent" : "w-1.5 bg-border-strong",
            )}
          />
        ))}
      </div>
    </div>
  );
}
