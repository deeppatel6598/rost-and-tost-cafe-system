import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/api-auth";
import { getStall } from "@/lib/store/stalls";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession();
  if (!session) redirect("/admin/login");

  const stall = session.stallId ? getStall(session.stallId) : null;

  return (
    // Staff see their own stall's colour on their own board, which is also
    // the fastest way to spot that you are signed in to the wrong stall.
    <div data-stall={session.stallId ?? undefined} className="flex min-h-screen flex-col">
      <AdminNav
        name={session.name}
        role={session.role}
        stallName={stall?.name ?? "All stalls"}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
