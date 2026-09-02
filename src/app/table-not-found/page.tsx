import Link from "next/link";
import { CANTEEN_SHORT_NAME } from "@/data/seed";

export const metadata = { title: "Table not recognised" };

import { Icon } from "@/components/ui/Icon";

export default function TableNotFoundPage() {
  return (
    <div data-surface="roast" className="flex min-h-screen items-center justify-center bg-[#0a0909] px-5">
      <div className="grid max-w-sm gap-4 rounded-2xl border border-roast-600 bg-roast-900 p-8 text-center text-on-dark">
        <span className="text-3xl" aria-hidden="true">
          <Icon name="alert" size={30} />
        </span>
        <h1 className="t-display-xs">We couldn&apos;t read that table code</h1>
        <p className="t-body-sm text-text-muted">
          The QR code may be damaged, or it may not be one of ours. Please ask a member of canteen staff to point
          you at the right code for your table — they can also take your order at the counter.
        </p>
        <p className="t-caption text-text-faint">{CANTEEN_SHORT_NAME}</p>
        <Link href="/" className="t-body-sm">
          Back to the canteen home
        </Link>
      </div>
    </div>
  );
}
