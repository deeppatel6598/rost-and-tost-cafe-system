import type { Metadata } from "next";
import { ScanClient } from "@/components/scan/ScanClient";

export const metadata: Metadata = {
  title: "Scan your table code",
};

export default function ScanPage() {
  return <ScanClient />;
}
