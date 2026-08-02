"use client";

import { TableBadge } from "@/components/order/TableBadge";
import { Button } from "@/components/ui/Button";

export function LandingView({
  tableNumber,
  cafeName,
  onStart,
}: {
  tableNumber: number;
  cafeName: string;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-[var(--gutter-guest)] py-10 text-center">
      <TableBadge tableNumber={tableNumber} />
      <div className="grid gap-2">
        <span className="t-display-lg">Welcome to {cafeName}.</span>
        <span className="t-body max-w-[34ch] text-text-muted">
          You're checked in at table {tableNumber}. Browse the menu and send your order straight to the kitchen —
          no app, no sign-up.
        </span>
      </div>
      <Button size="hero" onClick={onStart} autoFocus>
        See the menu
      </Button>
    </div>
  );
}
