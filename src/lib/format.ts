import { randomBytes } from "crypto";

export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatElapsed(fromIso: string, nowMs: number = Date.now()): string {
  const diffMs = nowMs - new Date(fromIso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export function formatClock(date: Date = new Date()): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function formatDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

let counter = 0;
export function generateId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Public order token used in the status URL. Random rather than sequential —
 * a sequential id would let anyone walk through every order on campus.
 */
export function generatePublicToken(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Masks a phone number for application logs. We keep enough to correlate a
 * support call, not enough to leak the number itself.
 */
export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}
