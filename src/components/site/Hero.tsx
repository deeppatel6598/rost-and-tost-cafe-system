import type { CafeSettings } from "@/lib/types";
import { FoodArt } from "@/components/ui/FoodArt";

export function Hero({ settings }: { settings: CafeSettings }) {
  return (
    <section id="top" data-surface="roast" className="bg-roast-950 text-on-dark">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-[clamp(16px,4vw,40px)] py-[clamp(40px,7vw,88px)] md:grid-cols-2 md:gap-16">
        <div className="grid gap-5">
          <span className="inline-flex h-8 w-max items-center gap-2 rounded-pill border border-roast-600 bg-roast-800 px-3.5 text-[13px] font-medium text-text-body">
            ● {settings.hours}
          </span>
          <h1 className="t-display-xl">{settings.tagline}</h1>
          <p className="t-body max-w-[46ch] text-[19px] text-text-body">
            A specialty coffee café and bakery in Sargasan, Gandhinagar. Take a table, scan the code on it, and
            order without waiting for anyone to find you.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#menu" className="flex h-14 items-center rounded-md bg-accent px-7 text-base font-semibold text-on-primary no-underline">
              See the menu
            </a>
            <a href="#visit" className="flex h-14 items-center rounded-md border border-roast-500 px-7 text-base font-semibold text-on-dark no-underline">
              Find us
            </a>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-text-muted">
            <span className="text-brass-500">★ {settings.rating}</span> from {settings.reviewCount.toLocaleString("en-IN")}+ Google reviews
          </div>
        </div>
        <div className="relative aspect-[4/3] min-h-[280px] w-full overflow-hidden rounded-2xl">
          <FoodArt art="latte" />
        </div>
      </div>
    </section>
  );
}
