import { cn } from "@/lib/cn";
import type { FoodType } from "@/lib/types";

const LABELS: Record<FoodType, string> = {
  veg: "Vegetarian",
  non_veg: "Non-vegetarian",
  jain: "Jain",
  egg: "Contains egg",
};

const COLORS: Record<FoodType, string> = {
  veg: "var(--veg)",
  non_veg: "var(--nonveg)",
  jain: "var(--jain)",
  egg: "var(--egg)",
};

/**
 * The FSSAI-style food marker, mandatory on Indian menus: a square outline
 * with a filled glyph inside. Green square + dot for veg, red square +
 * triangle for non-veg, and distinct treatments for egg and Jain so the four
 * are never told apart by colour alone.
 */
export function VegMark({
  type,
  withLabel = false,
  size = 16,
  className,
}: {
  type: FoodType;
  withLabel?: boolean;
  size?: number;
  className?: string;
}) {
  const color = COLORS[type];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      role="img"
      aria-label={LABELS[type]}
      title={LABELS[type]}
    >
      <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
        <rect x="1" y="1" width="16" height="16" rx="2" fill="none" stroke={color} strokeWidth="1.8" />
        {type === "veg" && <circle cx="9" cy="9" r="4.2" fill={color} />}
        {type === "non_veg" && <path d="M9 4.2 L14.2 13.4 L3.8 13.4 Z" fill={color} />}
        {type === "egg" && <ellipse cx="9" cy="9.4" rx="3.9" ry="4.6" fill={color} />}
        {type === "jain" && <path d="M9 3.8 L14.2 9 L9 14.2 L3.8 9 Z" fill={color} />}
      </svg>
      {withLabel && <span className="t-caption text-text-muted">{LABELS[type]}</span>}
    </span>
  );
}
