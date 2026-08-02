import QRCode from "qrcode";
import { signTableToken } from "@/lib/table-token";

/**
 * Site URL used to build table QR links. Prefers an explicit
 * NEXT_PUBLIC_SITE_URL (e.g. a custom domain) when one is set; otherwise the
 * caller should supply the real request origin (see getTableOrderUrl below)
 * so this works out of the box on any deployment — Netlify, Vercel, a
 * preview URL — with zero configuration. Only falls back to localhost when
 * neither is available (local dev without an origin, e.g. a script).
 */
export function getSiteUrl(origin?: string): string {
  return process.env.NEXT_PUBLIC_SITE_URL || origin || "http://localhost:3000";
}

export function getTableOrderPath(tableNumber: number): string {
  return `/order/${tableNumber}?t=${signTableToken(tableNumber)}`;
}

export function getTableOrderUrl(tableNumber: number, origin?: string): string {
  return `${getSiteUrl(origin)}${getTableOrderPath(tableNumber)}`;
}

export async function generateTableQrPng(tableNumber: number, origin?: string): Promise<Buffer> {
  const url = getTableOrderUrl(tableNumber, origin);
  return QRCode.toBuffer(url, {
    type: "png",
    margin: 2,
    width: 480,
    color: { dark: "#100f0e", light: "#faf9f5" },
  });
}

export async function generateTableQrDataUrl(tableNumber: number, origin?: string): Promise<string> {
  const url = getTableOrderUrl(tableNumber, origin);
  return QRCode.toDataURL(url, {
    margin: 2,
    width: 240,
    color: { dark: "#100f0e", light: "#faf9f5" },
  });
}
