import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OrderApp } from "@/components/order/OrderApp";
import { getSettings } from "@/lib/store/settings";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { tableId: string } }): Metadata {
  return { title: `Table ${params.tableId} — Order` };
}

export default function OrderTablePage({ params }: { params: { tableId: string } }) {
  const tableNumber = Number(params.tableId);
  if (!Number.isInteger(tableNumber) || tableNumber < 1) {
    notFound();
  }

  const settings = getSettings();
  return <OrderApp tableNumber={tableNumber} cafeName={settings.name} />;
}
