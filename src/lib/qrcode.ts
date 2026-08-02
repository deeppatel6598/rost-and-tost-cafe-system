import QRCode from "qrcode";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function getTableOrderUrl(tableNumber: number): string {
  return `${getSiteUrl()}/order/${tableNumber}`;
}

export async function generateTableQrPng(tableNumber: number): Promise<Buffer> {
  const url = getTableOrderUrl(tableNumber);
  return QRCode.toBuffer(url, {
    type: "png",
    margin: 2,
    width: 480,
    color: { dark: "#100f0e", light: "#faf9f5" },
  });
}

export async function generateTableQrDataUrl(tableNumber: number): Promise<string> {
  const url = getTableOrderUrl(tableNumber);
  return QRCode.toDataURL(url, {
    margin: 2,
    width: 240,
    color: { dark: "#100f0e", light: "#faf9f5" },
  });
}
