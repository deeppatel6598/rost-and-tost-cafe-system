import { cn } from "@/lib/cn";
import { FoodArt, artKeyFor, type FoodArtKey } from "@/components/ui/FoodArt";

/**
 * Renders the uploaded photoUrl when one exists; otherwise falls back to the
 * bundled illustration for that dish, so every screen looks finished before
 * real photography is shot.
 */
export function PlaceholderImage({
  photoUrl,
  itemId,
  categoryId,
  art,
  alt,
  className,
  rounded = "rounded-lg",
}: {
  photoUrl?: string;
  itemId?: string;
  categoryId?: string;
  art?: FoodArtKey;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt={alt} className={cn("h-full w-full object-cover", rounded, className)} />;
  }

  const key = art ?? artKeyFor(itemId ?? "", categoryId ?? "");

  return (
    <div className={cn("h-full w-full overflow-hidden", rounded, className)} role="img" aria-label={alt}>
      <FoodArt art={key} />
    </div>
  );
}
