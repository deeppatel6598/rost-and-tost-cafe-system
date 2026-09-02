import { cn } from "@/lib/cn";

/**
 * The icon set.
 *
 * Everything here was a text glyph before — "↗", "⌕", "▣", "🗑" — and text
 * glyphs are the wrong tool: they render differently on every Android build,
 * they cannot be sized against the text next to them, and some of them fall
 * back to a tofu box on the cheap phones this app is actually used on.
 *
 * One geometry for all of them: a 24-unit grid, 1.75 stroke, round caps and
 * joins, drawn in currentColor so an icon always matches the text it sits
 * beside. Anything that needs a filled mark says so explicitly.
 */

export type IconName =
  | "arrow-left"
  | "arrow-up-right"
  | "chevron-right"
  | "chevron-down"
  | "search"
  | "plus"
  | "minus"
  | "close"
  | "check"
  | "trash"
  | "phone"
  | "cash"
  | "qr"
  | "clock"
  | "alert"
  | "receipt"
  | "flame"
  | "bell"
  | "cart"
  | "dot"
  | "check-circle"
  | "x-circle"
  | "table";

const PATHS: Record<IconName, JSX.Element> = {
  "arrow-left": (
    <>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </>
  ),
  "arrow-up-right": (
    <>
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </>
  ),
  "chevron-right": <path d="M9.5 5l7 7-7 7" />,
  "chevron-down": <path d="M5 9l7 7 7-7" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </>
  ),
  minus: <path d="M5.5 12h13" />,
  close: (
    <>
      <path d="M6.5 6.5l11 11" />
      <path d="M17.5 6.5l-11 11" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5L19.5 7" />,
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9.5 7V5.5a1.5 1.5 0 011.5-1.5h2a1.5 1.5 0 011.5 1.5V7" />
      <path d="M6.5 7l.9 12.1A1.5 1.5 0 008.9 20.5h6.2a1.5 1.5 0 001.5-1.4L17.5 7" />
    </>
  ),
  phone: (
    <path d="M6.2 3.5h3l1.4 3.6-1.8 1.4a12.5 12.5 0 006.7 6.7l1.4-1.8 3.6 1.4v3a2 2 0 01-2.2 2A16.5 16.5 0 014.2 5.7a2 2 0 012-2.2z" />
  ),
  cash: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 10.5v.01" />
      <path d="M18 13.5v.01" />
    </>
  ),
  qr: (
    <>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5" />
      <path d="M14 14h3" />
      <path d="M20.5 14v3" />
      <path d="M17 17.5v3" />
      <path d="M20.5 20.5h-3.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.2l8.6 15.3a1 1 0 01-.9 1.5H4.3a1 1 0 01-.9-1.5z" />
      <path d="M12 10v4" />
      <path d="M12 17.4v.01" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3.5h12v17l-2.4-1.5-2.4 1.5-2.4-1.5-2.4 1.5-2.4-1.5z" />
      <path d="M9.5 8.5h5" />
      <path d="M9.5 12.5h5" />
    </>
  ),
  flame: (
    <path d="M12.5 3c1.8 3 4.5 4.4 4.5 7.8a5 5 0 01-10 0c0-1.8.8-2.9 1.8-3.9.2 1.4.9 2 1.5 2 .6-2-1.3-4.3 2.2-5.9z" />
  ),
  bell: (
    <>
      <path d="M6.5 9.5a5.5 5.5 0 0111 0c0 4.6 1.8 5.8 1.8 5.8H4.7s1.8-1.2 1.8-5.8z" />
      <path d="M10 18.5a2 2 0 004 0" />
    </>
  ),
  cart: (
    <>
      <path d="M2.5 4h2.2l2.4 11h10l2-7.5H6.2" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.3l2.5 2.5 4.5-5" />
    </>
  ),
  "x-circle": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.5l5 5" />
      <path d="M14.5 9.5l-5 5" />
    </>
  ),
  table: (
    <>
      <path d="M3.5 8.5h17" />
      <path d="M6 8.5V19" />
      <path d="M18 8.5V19" />
      <path d="M5 5.5h14" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.75,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
