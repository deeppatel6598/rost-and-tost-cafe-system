import { cn } from "@/lib/cn";
import type { CategoryIcon } from "@/lib/types";
import { CategoryGlyph } from "@/components/ui/CategoryGlyph";

/**
 * Stands in for a real product photo. Renders the uploaded photoUrl when one
 * exists; otherwise a branded gradient tile with a category glyph, so every
 * screen still looks finished before real photography is added.
 */
export function PlaceholderImage({
  photoUrl,
  icon = "desserts",
  alt,
  className,
  rounded = "rounded-lg",
}: {
  photoUrl?: string;
  icon?: CategoryIcon;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt={alt} className={cn("h-full w-full object-cover", rounded, className)} />;
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-roast-800 via-roast-900 to-roast-950",
        rounded,
        className,
      )}
      role="img"
      aria-label={alt}
    >
      <CategoryGlyph icon={icon} className="h-[38%] w-[38%] text-coral-300/70" />
    </div>
  );
}
