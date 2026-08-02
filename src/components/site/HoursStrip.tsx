import type { CafeSettings } from "@/lib/types";

export function HoursStrip({ settings }: { settings: CafeSettings }) {
  const items = [
    { label: "Hours", value: settings.hours },
    { label: "Where", value: `${settings.addressLine1}, ${settings.addressLine2}` },
    { label: "Ordering", value: "Scan the code on your table. No app, no sign-up." },
  ];
  return (
    <section className="border-b border-hairline bg-paper-1">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-[clamp(16px,4vw,40px)] py-[clamp(24px,3.5vw,40px)] sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="grid gap-1.5">
            <span className="t-overline text-text-faint">{it.label}</span>
            <span className="t-body text-text-body">{it.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
