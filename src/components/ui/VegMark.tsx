import { cn } from "@/lib/cn";
import type { VegMark as VegMarkType } from "@/lib/types";

const LABELS: Record<VegMarkType, string> = {
  veg: "Vegetarian",
  nonveg: "Non-vegetarian",
  egg: "Contains egg",
};

const COLORS: Record<VegMarkType, string> = {
  veg: "var(--veg)",
  nonveg: "var(--nonveg)",
  egg: "var(--egg)",
};

/**
 * The FSSAI-style veg/non-veg mark, mandatory on Indian food menus: a square
 * outline with a filled dot (veg) or filled triangle (non-veg). Egg gets its
 * own amber square + circle so eggetarian guests can tell it apart from meat.
 */
export function VegMark({
  type,
  withLabel = false,
  size = 16,
  className,
}: {
  type: VegMarkType;
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
        <rect x="1" y="1" width="16" height="16" rx="2" fill="none" stroke={color} strokeWidth="1.6" />
        {type === "veg" && <circle cx="9" cy="9" r="4.2" fill={color} />}
        {type === "nonveg" && <path d="M9 4 L14.2 13.2 L3.8 13.2 Z" fill={color} />}
        {type === "egg" && <ellipse cx="9" cy="9.5" rx="4" ry="4.6" fill={color} />}
      </svg>
      {withLabel && <span className="t-caption text-text-muted">{LABELS[type]}</span>}
    </span>
  );
}
