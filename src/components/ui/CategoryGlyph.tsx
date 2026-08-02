import type { CategoryIcon } from "@/lib/types";

/** Simple line-art glyphs standing in for real category photography. */
export function CategoryGlyph({ icon, className }: { icon: CategoryIcon; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icon) {
    case "coffee":
      return (
        <svg {...common}>
          <path d="M10 18h22v10a11 11 0 0 1-11 11h0A11 11 0 0 1 10 28V18Z" />
          <path d="M32 20h3a5 5 0 0 1 0 10h-3" />
          <path d="M16 10c0 2-2 2-2 4s2 2 2 4" />
          <path d="M24 10c0 2-2 2-2 4s2 2 2 4" />
        </svg>
      );
    case "tea":
      return (
        <svg {...common}>
          <path d="M8 20h26v6a12 12 0 0 1-12 12h-2A12 12 0 0 1 8 26v-6Z" />
          <path d="M34 22h3a4.5 4.5 0 0 1 0 9h-3" />
          <path d="M14 12c0 1.6-2 1.6-2 3.2S14 16.8 14 18" />
          <path d="M22 12c0 1.6-2 1.6-2 3.2S22 16.8 22 18" />
        </svg>
      );
    case "bakery":
      return (
        <svg {...common}>
          <path d="M6 26c4-10 10-14 18-14s14 4 18 14c-2 4-9 6-18 6S8 30 6 26Z" />
          <path d="M14 22c1-3 3-5 6-6" />
          <path d="M24 20c1-3 3-5 6-6" />
        </svg>
      );
    case "breakfast":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="16" />
          <circle cx="24" cy="24" r="6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "pizza":
      return (
        <svg {...common}>
          <path d="M24 6 42 40H6L24 6Z" />
          <circle cx="24" cy="20" r="2" fill="currentColor" stroke="none" />
          <circle cx="19" cy="28" r="2" fill="currentColor" stroke="none" />
          <circle cx="29" cy="30" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "plates":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="16" />
          <circle cx="24" cy="24" r="9" />
          <path d="M8 10v10M8 10c0-1 1.5-1 1.5 0v6c0 1.5-1.5 1.5-1.5 0" />
        </svg>
      );
    case "desserts":
    default:
      return (
        <svg {...common}>
          <path d="M24 6l6 10H18l6-10Z" />
          <path d="M12 16h24l-3 22a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3L12 16Z" />
        </svg>
      );
  }
}
