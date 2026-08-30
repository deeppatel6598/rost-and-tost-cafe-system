import Link from "next/link";
import { CANTEEN_NAME } from "@/data/seed";
import { listStallViews } from "@/lib/store/stalls";
import { FoodArt, asArtKey } from "@/components/ui/FoodArt";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", title: "Scan your table", body: "Every table has its own code. It opens the menu and remembers where you're sitting." },
  { n: "02", title: "Pick a stall", body: "Four kitchens, four menus. Order from one, then from another if you want." },
  { n: "03", title: "Pay your way", body: "UPI from your phone, or cash at that stall's counter when you collect." },
];

export default function HomePage() {
  const stalls = listStallViews();

  return (
    <div data-surface="roast" className="min-h-screen bg-roast-950 text-on-dark">
      <header className="sticky top-0 z-40 border-b border-roast-600 bg-roast-950">
        <div className="mx-auto flex max-w-[1100px] items-center gap-4 px-5 py-4">
          <span className="t-title-md">SK University Canteen</span>
          <Link
            href="/scan"
            className="ml-auto flex h-11 items-center rounded-md bg-accent px-5 text-[15px] font-semibold text-on-primary no-underline"
          >
            Scan &amp; order
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1100px] gap-5 px-5 py-12">
        <h1 className="t-display-lg max-w-[18ch]">Order from your table. Skip the queue.</h1>
        <p className="t-body max-w-[52ch] text-[18px] text-text-body">
          {CANTEEN_NAME}. Scan the code on your table, order from any of the four stalls, and collect when your
          token is called.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/scan"
            className="flex h-14 items-center rounded-md bg-accent px-7 text-base font-semibold text-on-primary no-underline"
          >
            Scan your table code
          </Link>
          <Link
            href="/admin"
            className="flex h-14 items-center rounded-md border border-roast-500 px-7 text-base font-semibold text-on-dark no-underline"
          >
            Stall sign in
          </Link>
        </div>
      </section>

      <section className="border-y border-roast-600 bg-roast-900">
        <div className="mx-auto grid max-w-[1100px] gap-5 px-5 py-12">
          <h2 className="t-display-sm">The four stalls</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {stalls.map((stall) => (
              <div key={stall.id} className="grid gap-3 rounded-xl border border-roast-600 bg-roast-800 p-4">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg">
                  <FoodArt art={asArtKey(stall.art)} />
                </div>
                <span className="t-title-sm">{stall.name}</span>
                <span className="t-body-sm text-text-muted">{stall.description}</span>
                <span className="t-caption text-text-faint">
                  {stall.opensAt} – {stall.closesAt} · {stall.availability.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-5 px-5 py-12">
        <h2 className="t-display-sm">How it works</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
          {STEPS.map((step) => (
            <div key={step.n} className="grid content-start gap-2 rounded-xl border border-roast-600 bg-roast-900 p-5">
              <span className="t-mono text-[13px] text-accent">{step.n}</span>
              <span className="t-title-md">{step.title}</span>
              <span className="t-body-sm text-text-muted">{step.body}</span>
            </div>
          ))}
        </div>
        <p className="t-body-sm text-text-muted">
          Each stall is an independent business with its own bill, so a cart holds one stall&apos;s food at a time.
          Ordering from a second stall creates a second token.
        </p>
      </section>

      <footer className="border-t border-roast-600">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-2 px-5 py-6 text-[13px] text-on-dark-faint">
          <span>{CANTEEN_NAME}</span>
          <span>
            Created by <span className="font-medium text-text-body">@deeppatel</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
