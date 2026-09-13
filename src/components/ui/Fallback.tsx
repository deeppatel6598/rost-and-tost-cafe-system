import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CANTEEN_SHORT_NAME } from "@/data/canteen";

/**
 * The shell every dead-end in the app shares — a bad QR code, a missing page,
 * a render that threw.
 *
 * Written for the worst moment it will actually be read in: standing at a
 * table, holding a phone, halfway through ordering lunch. So it says what to
 * do next in the room rather than what went wrong in the software, and it
 * always offers the counter as the way out. No stack traces, no error codes —
 * a student can do nothing with either, and a digest tells an attacker more
 * than it tells them.
 */
export function Fallback({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { href: string; label: string } | { onRetry: () => void; label: string };
}) {
  return (
    <div data-surface="roast" className="flex min-h-screen items-center justify-center bg-[#0a0909] px-5">
      <div className="grid max-w-sm gap-4 rounded-2xl border border-roast-600 bg-roast-900 p-8 text-center text-on-dark">
        <span className="text-3xl" aria-hidden="true">
          <Icon name="alert" size={30} />
        </span>
        <h1 className="t-display-xs">{title}</h1>
        <p className="t-body-sm text-text-muted">{message}</p>
        <p className="t-caption text-text-faint">{CANTEEN_SHORT_NAME}</p>
        {action && "onRetry" in action ? (
          <button
            type="button"
            onClick={action.onRetry}
            className="mx-auto min-h-[44px] rounded-md px-4 t-body-sm underline"
          >
            {action.label}
          </button>
        ) : (
          <Link
            href={action?.href ?? "/"}
            className="mx-auto flex min-h-[44px] items-center justify-center px-4 t-body-sm"
          >
            {action?.label ?? "Back to the canteen home"}
          </Link>
        )}
      </div>
    </div>
  );
}
