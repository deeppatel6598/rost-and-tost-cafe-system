import { getSettings } from "@/lib/store/settings";

export default function OrderEntryPage() {
  const settings = getSettings();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-[var(--gutter-guest)] py-10 text-center">
      <span className="t-display-md">Scan the code on your table</span>
      <p className="t-body max-w-[34ch] text-text-muted">
        Every table at {settings.name} has its own QR code. Scan it with your phone's camera and the menu for your
        table opens automatically — no app, no link to type in.
      </p>
    </div>
  );
}
