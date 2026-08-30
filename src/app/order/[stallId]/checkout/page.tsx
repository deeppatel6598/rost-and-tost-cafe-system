import { notFound, redirect } from "next/navigation";
import { getTableSession } from "@/lib/api-auth";
import { getStall, toStallView } from "@/lib/store/stalls";
import { CheckoutClient } from "@/components/order/CheckoutClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

interface Params {
  params: { stallId: string };
}

export default async function CheckoutPage({ params }: Params) {
  const session = await getTableSession();
  if (!session) redirect("/scan");

  const stall = getStall(params.stallId);
  if (!stall) notFound();

  return <CheckoutClient tableNumber={session.tableNumber} stall={toStallView(stall)} />;
}
