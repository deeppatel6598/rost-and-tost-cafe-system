"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";

const TABS = [
  { href: "/admin", label: "Live orders" },
  { href: "/admin/tables", label: "Tables" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/history", label: "History" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [clock, setClock] = useState(formatClock());
  const [liveCount, setLiveCount] = useState(0);
  const [guestViewPath, setGuestViewPath] = useState("/order");

  useEffect(() => {
    fetch("/api/tables/link/1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.path && setGuestViewPath(d.path))
      .catch(() => {
        /* fall back to the plain scan-instructions page */
      });
  }, []);

  useEffect(() => {
    const clockTimer = setInterval(() => setClock(formatClock()), 15000);
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) return;
        const { orders } = await res.json();
        if (!cancelled) {
          setLiveCount(orders.filter((o: { status: string }) => o.status === "received" || o.status === "preparing").length);
        }
      } catch {
        /* keep last known count on transient network errors */
      }
    }
    poll();
    const countTimer = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      clearInterval(clockTimer);
      clearInterval(countTimer);
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-4 border-b border-border bg-surface px-[var(--gutter-admin)] py-4">
      <span className="t-display-xs">Roast and Toast · Counter</span>
      <nav className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex h-14 items-center rounded-md border px-5 text-base font-semibold no-underline transition-colors duration-base",
                active ? "border-border-strong bg-paper-3 text-text" : "border-border text-text-muted hover:text-text",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <span className="t-mono ml-auto flex h-11 items-center gap-2 rounded-pill border border-border bg-surface-sunken px-4 text-[15px] text-text-muted">
        <span aria-hidden="true">●</span> {liveCount} open · {clock}
      </span>
      <Link href={guestViewPath} className="text-[15px] font-medium">
        Guest view
      </Link>
      <button type="button" onClick={logout} className="text-[15px] font-medium text-text-muted hover:text-text">
        Log out
      </button>
    </header>
  );
}
