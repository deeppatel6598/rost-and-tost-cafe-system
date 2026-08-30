import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/api-auth";
import { OrderQueue } from "@/components/admin/OrderQueue";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order queue" };

export default async function AdminOrdersPage() {
  const session = await getStaffSession();
  if (!session) redirect("/admin/login");
  // The supervisor has no queue of their own — they oversee, they don't cook.
  if (session.role === "super_admin") redirect("/admin/super");

  return <OrderQueue />;
}
