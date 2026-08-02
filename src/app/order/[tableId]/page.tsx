import type { Metadata } from "next";
import { OrderApp } from "@/components/order/OrderApp";
import { getSettings } from "@/lib/store/settings";
import { verifyTableToken } from "@/lib/table-token";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { tableId: string } }): Metadata {
  return { title: `Table ${params.tableId} — Order` };
}

export default function OrderTablePage({
  params,
  searchParams,
}: {
  params: { tableId: string };
  searchParams: { t?: string };
}) {
  const tableNumber = Number(params.tableId);
  const settings = getSettings();

  const valid = Number.isInteger(tableNumber) && tableNumber > 0 && verifyTableToken(tableNumber, searchParams.t);

  if (!valid) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-[var(--gutter-guest)] py-10 text-center">
        <span className="t-display-sm">This link isn't valid for a table</span>
        <p className="t-body max-w-[34ch] text-text-muted">
          Table links are tied to the QR code printed at each table, so scan the code on your table rather than
          typing or editing this address — it opens the right menu automatically.
        </p>
      </div>
    );
  }

  return <OrderApp tableNumber={tableNumber} tableToken={searchParams.t!} cafeName={settings.name} />;
}
