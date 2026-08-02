import { CategoryGlyph } from "@/components/ui/CategoryGlyph";

const TILES = ["Counter", "Window seats", "Bake case", "A table at night"];

export function RoomGallery() {
  return (
    <section className="bg-paper-0">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-[clamp(16px,4vw,40px)] py-[clamp(44px,7vw,88px)]">
        <h2 className="t-display-lg">The room</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {TILES.map((label) => (
            <div key={label} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-roast-800 via-roast-900 to-roast-950">
              <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                <CategoryGlyph icon="bakery" className="h-10 w-10 text-coral-300/60" />
                <span className="t-caption text-on-dark-faint">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
