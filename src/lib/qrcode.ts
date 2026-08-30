import QRCode from "qrcode";
import type { DiningTable } from "@/lib/types";

/**
 * Site URL for printed QR codes. Prefers an explicit NEXT_PUBLIC_SITE_URL,
 * otherwise the origin the request arrived on, so codes generated from a
 * deployment point at that deployment with no configuration.
 */
export function getSiteUrl(origin?: string): string {
  return process.env.NEXT_PUBLIC_SITE_URL || origin || "http://localhost:3000";
}

/** The path a table sticker encodes. Signed token, never a bare number. */
export function getTablePath(table: DiningTable): string {
  return `/t/${table.qrToken}`;
}

export function getTableUrl(table: DiningTable, origin?: string): string {
  return `${getSiteUrl(origin)}${getTablePath(table)}`;
}

export async function generateTableQrPng(table: DiningTable, origin?: string): Promise<Buffer> {
  return QRCode.toBuffer(getTableUrl(table, origin), {
    type: "png",
    margin: 2,
    width: 640,
    errorCorrectionLevel: "M",
    color: { dark: "#141413", light: "#ffffff" },
  });
}

/** Data URL of an arbitrary payload — used for the UPI fallback QR. */
export async function generateQrDataUrl(payload: string, size = 240): Promise<string> {
  return QRCode.toDataURL(payload, {
    margin: 1,
    width: size,
    errorCorrectionLevel: "M",
    color: { dark: "#141413", light: "#ffffff" },
  });
}
