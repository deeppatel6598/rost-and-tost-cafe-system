import { FoodArt, type FoodArtKey } from "@/components/ui/FoodArt";

const TILES: { label: string; art: FoodArtKey }[] = [
  { label: "The espresso bar", art: "espresso" },
  { label: "Fresh from the oven", art: "croissant" },
  { label: "The bake case", art: "cheesecake" },
  { label: "Hot plates all day", art: "pizza" },
];

export function RoomGallery() {
  return (
    <section className="bg-paper-0">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-[clamp(16px,4vw,40px)] py-[clamp(44px,7vw,88px)]">
        <h2 className="t-display-lg">The room</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {TILES.map((tile) => (
            <div key={tile.label} className="relative aspect-[3/4] overflow-hidden rounded-xl">
              <FoodArt art={tile.art} />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-roast-950/90 to-transparent px-3 pb-3 pt-8 text-[13px] font-medium text-on-dark">
                {tile.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
