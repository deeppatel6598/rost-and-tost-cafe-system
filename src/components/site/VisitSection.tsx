import type { CafeSettings } from "@/lib/types";
import { CategoryGlyph } from "@/components/ui/CategoryGlyph";
import { ContactForm } from "@/components/site/ContactForm";

export function VisitSection({ settings }: { settings: CafeSettings }) {
  return (
    <section id="visit" className="border-t border-hairline bg-paper-1">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-[clamp(16px,4vw,40px)] py-[clamp(44px,7vw,88px)] md:grid-cols-2 md:gap-14">
        <div className="grid content-start gap-4">
          <h2 className="t-display-lg">Visit us</h2>
          <p className="t-body text-[17px] text-text-body">
            {settings.addressLine1}
            <br />
            {settings.addressLine2}
          </p>
          <div className="grid gap-1.5 text-[16px] text-text-muted">
            <span>{settings.hours}</span>
            <span>Walk in — we don't take table bookings.</span>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <a href={settings.mapsUrl} className="flex h-14 items-center rounded-md bg-accent px-7 text-base font-semibold text-on-primary no-underline">
              Get directions
            </a>
            <a href={`tel:${settings.phone}`} className="flex h-14 items-center rounded-md border border-border-strong px-7 text-base font-semibold text-text no-underline">
              Call the café
            </a>
          </div>
        </div>
        <div className="grid gap-6">
          <div className="relative aspect-[4/3] min-h-[220px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-roast-800 via-roast-900 to-roast-950">
            <div className="flex h-full w-full items-center justify-center">
              <CategoryGlyph icon="tea" className="h-1/4 w-1/4 text-coral-300/60" />
            </div>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
