"use client";

import { useEffect, useState } from "react";
import type { Order, Table } from "@/lib/types";
import { TableTile } from "@/components/admin/TableTile";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function TablesPage() {
  const { showToast } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    const [tRes, oRes] = await Promise.all([fetch("/api/tables"), fetch("/api/orders")]);
    if (tRes.ok) setTables((await tRes.json()).tables);
    if (oRes.ok) setOrders((await oRes.json()).orders);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  async function addTable(e: React.FormEvent) {
    e.preventDefault();
    const number = Number(newNumber);
    if (!number || number < 1) return;
    setAdding(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewNumber("");
      showToast(`Added table ${number}`, "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add table.", "danger");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="grid gap-4 px-[var(--gutter-admin)] py-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="t-display-sm">Tables</span>
        <form onSubmit={addTable} className="ml-auto flex items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder="Table number"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            className="h-11 w-36 rounded-md border border-border bg-surface px-3"
          />
          <Button size="sm" type="submit" disabled={adding}>
            Add table
          </Button>
        </form>
      </div>
      <p className="t-body-sm text-text-muted">
        Each table's QR code points guests straight to its ordering screen on whichever domain you're viewing this
        page from. Print and place one at every table — download individual codes below. If you ever move to a
        custom domain, set <code>NEXT_PUBLIC_SITE_URL</code> to pin the codes to it explicitly.
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
        {tables.map((table) => {
          const openOrder =
            orders.find((o) => o.tableNumber === table.number && (o.status === "received" || o.status === "preparing")) ?? null;
          return <TableTile key={table.id} number={table.number} openOrder={openOrder} />;
        })}
      </div>
    </div>
  );
}
