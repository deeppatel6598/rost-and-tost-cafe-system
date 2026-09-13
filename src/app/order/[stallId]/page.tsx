import { notFound, redirect } from "next/navigation";
import { getTableSession } from "@/lib/api-auth";
import { listCategories, listStallMenu } from "@/lib/store/menu";
import { getStall, toStallView } from "@/lib/store/stalls";
import { MenuBrowser } from "@/components/order/MenuBrowser";

export const dynamic = "force-dynamic";

interface Params {
  params: { stallId: string };
}

export async function generateMetadata({ params }: Params) {
  const stall = await getStall(params.stallId);
  return { title: stall ? stall.name : "Menu" };
}

export default async function StallMenuPage({ params }: Params) {
  const session = await getTableSession();
  if (!session) redirect("/scan");

  const stall = await getStall(params.stallId);
  if (!stall) notFound();

  return (
    <MenuBrowser
      tableNumber={session.tableNumber}
      stall={toStallView(stall)}
      categories={await listCategories(stall.id)}
      items={await listStallMenu(stall.id)}
    />
  );
}
