export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatElapsed(fromIso: string, nowMs: number = Date.now()): string {
  const diffMs = nowMs - new Date(fromIso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m ago`;
}

export function formatClock(date: Date = new Date()): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function formatTimeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

let counter = 0;
export function generateId(prefix: string): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${Date.now().toString(36)}${counter}${rand}`;
}

// No "#" here on purpose — this id gets embedded in fetch URL paths (e.g.
// `/api/orders/${id}`), and "#" is a URL fragment delimiter that the browser
// strips client-side before the request is even sent. Any "#" prefix is
// added only where the id is displayed, never in the id itself.
export function generateOrderCode(sequence: number): string {
  return `A-${100 + sequence}`;
}
