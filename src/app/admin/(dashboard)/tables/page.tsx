import { getSiteUrl, getTablePath } from "@/lib/qrcode";
import { listTables } from "@/lib/store/tables";

export const dynamic = "force-dynamic";
export const metadata = { title: "Table QR codes" };

export default function TablesPage() {
  const tables = listTables();
  const siteUrl = getSiteUrl();

  return (
    <div className="grid gap-4 px-4 py-5">
      <div>
        <span className="t-display-sm block">Table QR codes</span>
        <span className="t-body-sm text-text-muted">
          Print one per table. Each code is signed, so a student cannot change the table number in the link.
        </span>
      </div>

      <p className="t-body-sm rounded-md border border-border bg-surface px-4 py-3 text-text-muted">
        Codes point at <span className="font-mono text-text">{siteUrl}</span>. Set{" "}
        <code>NEXT_PUBLIC_SITE_URL</code> to the live domain before printing, or download from the live site so the
        links match.
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {tables.map((table) => (
          <div key={table.id} className="grid gap-2 rounded-xl border border-border bg-surface p-4">
            <span className="font-mono text-2xl font-bold">
              {String(table.tableNumber).padStart(2, "0")}
            </span>
            <span className="t-caption break-all text-text-faint">{getTablePath(table)}</span>
            <a
              href={`/api/admin/tables/${table.id}/qr`}
              download={`table-${table.tableNumber}-qr.png`}
              className="t-body-sm"
            >
              Download QR
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
