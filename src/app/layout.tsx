import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import { CANTEEN_NAME } from "@/data/seed";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SK University Canteen",
    template: "%s · SK Canteen",
  },
  description: `Order from your table at ${CANTEEN_NAME}. Scan the code, pick a stall, pay by UPI or cash.`,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SK Canteen" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Ordering happens on a phone held at arm's length in a bright hall; let
  // students zoom rather than locking the scale.
  maximumScale: 5,
  themeColor: "#100f0e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${cormorant.variable}`}
    >
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
