import { redirect } from "next/navigation";
import { getTableSession } from "@/lib/api-auth";
import { listStallViews } from "@/lib/store/stalls";
import { StallPicker } from "@/components/order/StallPicker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Choose a stall" };

export default async function StallSelectionPage() {
  const session = await getTableSession();
  // No table session means they didn't come through a QR code.
  if (!session) redirect("/scan");

  const stalls = listStallViews();

  return (
    <StallPicker
      tableNumber={session.tableNumber}
      stalls={stalls.map((s) => ({
        id: s.id,
        name: s.name,
        tagline: s.tagline,
        art: s.art,
        availability: s.availability,
      }))}
    />
  );
}
