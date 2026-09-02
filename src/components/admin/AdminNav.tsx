"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";
import type { StaffRole } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

const STALL_TABS = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/today", label: "Today" },
  { href: "/admin/stall", label: "Stall" },
  { href: "/admin/tables", label: "Tables" },
];

const SUPER_TABS = [
  { href: "/admin/super", label: "Canteen" },
  { href: "/admin/tables", label: "Tables" },
];

export function AdminNav({
  name,
  role,
  stallName,
}: {
  name: string;
  role: StaffRole;
  stallName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [clock, setClock] = useState(formatClock());

  useEffect(() => {
    const t = setInterval(() => setClock(formatClock()), 30000);
    return () => clearInterval(t);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const tabs = role === "super_admin" ? SUPER_TABS : STALL_TABS;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="grid">
          <span className="t-title-md leading-tight">{stallName}</span>
          <span className="t-caption text-text-muted">
            {name} · {role === "super_admin" ? "Supervisor" : role === "stall_owner" ? "Owner" : "Counter"}
          </span>
        </div>

        <span className="t-mono ml-auto inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-sunken px-3 py-1.5 text-[13px] text-text-muted">
          <Icon name="clock" size={14} />
          {clock}
        </span>
        <button
          type="button"
          onClick={logout}
          className="inline-flex h-11 items-center rounded-md px-3 text-[15px] font-medium text-text-muted hover:bg-surface-raised hover:text-text"
        >
          Sign out
        </button>
      </div>

      <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        {tabs.map((tab) => {
          const active =
            tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                // 56px tall: this gets tapped on a phone, in a hurry, often
                // with wet hands.
                "flex h-14 shrink-0 items-center rounded-md border px-5 text-base font-semibold no-underline",
                "transition-colors duration-fast",
                active
                  ? "border-transparent bg-accent-fill text-accent-on"
                  : "border-border text-text-muted hover:bg-surface-raised hover:text-text",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
