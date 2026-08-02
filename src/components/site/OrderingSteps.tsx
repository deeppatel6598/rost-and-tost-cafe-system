import Link from "next/link";

const STEPS = [
  {
    n: "01",
    title: "Scan the table",
    body: "The code on your table opens the menu in your browser and remembers which table you're at.",
  },
  {
    n: "02",
    title: "Send your round",
    body: "Add what you want and send it. The kitchen sees it immediately — no waiting to be noticed.",
  },
  {
    n: "03",
    title: "Pay at the counter",
    body: "Every round joins the same table bill. Settle it once, whenever you're ready to leave.",
  },
];

export function OrderingSteps({ demoTablePath }: { demoTablePath: string }) {
  return (
    <section id="ordering" data-surface="roast" className="bg-roast-950 text-on-dark">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-[clamp(16px,4vw,40px)] py-[clamp(44px,7vw,88px)] sm:gap-14">
        <div className="grid max-w-[56ch] gap-4">
          <h2 className="t-display-lg">Order from where you're sitting</h2>
          <p className="t-body text-[18px] text-text-body">
            Every table has its own code. The kitchen sees your order the moment you send it, and you can keep
            adding rounds through the evening. Pay once, at the counter.
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="grid content-start gap-3 rounded-lg border border-roast-600 bg-roast-900 p-6">
              <span className="t-mono text-[13px] text-accent">{s.n}</span>
              <span className="t-display-xs">{s.title}</span>
              <span className="t-body-sm text-text-muted">{s.body}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-roast-600 bg-roast-900 p-6">
          <span className="flex-1 text-[16px] text-text-body" style={{ minWidth: 260 }}>
            Want to see the ordering screens as a guest would? Open the live prototype.
          </span>
          <Link href={demoTablePath} className="flex h-14 items-center rounded-md bg-accent px-7 text-base font-semibold text-on-primary no-underline">
            Open the prototype
          </Link>
        </div>
      </div>
    </section>
  );
}
