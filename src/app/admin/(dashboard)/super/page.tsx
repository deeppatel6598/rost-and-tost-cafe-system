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

  const stalls = await listStallViews();

  // Four stalls' day summaries in parallel rather than one after another.
  const [canteen, problems, perStall] = await Promise.all([
    todayStats(null),
    listProblemOrders(null),
    Promise.all(
      stalls.map(async (stall) => ({
        id: stall.id,
        name: stall.name,
        availability: stall.availability,
        stats: await todayStats(stall.id),
      })),
    ),
  ]);

  return <SuperAdminView canteen={canteen} problems={problems} stalls={perStall} />;
}
