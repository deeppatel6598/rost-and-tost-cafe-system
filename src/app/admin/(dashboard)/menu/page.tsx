import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/api-auth";
import { MenuManager } from "@/components/admin/MenuManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu" };

export default async function AdminMenuPage() {
  const session = await getStaffSession();
  if (!session) redirect("/admin/login");
  // A supervisor oversees the canteen but does not edit a stall's own menu or prices.
  if (session.role === "super_admin") redirect("/admin/super");

  return <MenuManager />;
}
