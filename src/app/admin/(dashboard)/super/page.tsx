import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/api-auth";
import { listProblemOrders, todayStats } from "@/lib/store/orders";
import { listStallViews } from "@/lib/store/stalls";
import { SuperAdminView } from "@/components/admin/SuperAdminView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Canteen overview" };

export default async function SuperAdminPage() {
  const session = await getStaffSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "super_admin") redirect("/admin");

  const stalls = listStallViews();

  return (
    <SuperAdminView
      canteen={todayStats(null)}
      problems={listProblemOrders(null)}
      stalls={stalls.map((stall) => ({
        id: stall.id,
        name: stall.name,
        availability: stall.availability,
        stats: todayStats(stall.id),
      }))}
    />
  );
}
