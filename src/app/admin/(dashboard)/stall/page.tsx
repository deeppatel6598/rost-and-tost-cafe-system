import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/api-auth";
import { StallControls } from "@/components/admin/StallControls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stall settings" };

export default async function StallSettingsPage() {
  const session = await getStaffSession();
  if (!session) redirect("/admin/login");
  if (session.role === "super_admin") redirect("/admin/super");

  return <StallControls canEditPayout={session.role === "stall_owner"} />;
}
