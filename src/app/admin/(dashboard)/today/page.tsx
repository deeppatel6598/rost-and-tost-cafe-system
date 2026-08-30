import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/api-auth";
import { listProblemOrders, todayStats } from "@/lib/store/orders";
import { getStall } from "@/lib/store/stalls";
import { TodayView } from "@/components/admin/TodayView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Today" };

export default async function TodayPage() {
  const session = await getStaffSession();
  if (!session) redirect("/admin/login");
  if (session.role === "super_admin" || !session.stallId) redirect("/admin/super");

  const stall = getStall(session.stallId);

  return (
    <TodayView
      title={stall?.name ?? "Today"}
      stats={todayStats(session.stallId)}
      problems={listProblemOrders(session.stallId)}
    />
  );
}
