import { Fallback } from "@/components/ui/Fallback";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <Fallback
      title="That page isn't here"
      message="The link may be old, or the order it pointed at may have been cleared. Scan the QR code on your table to start again, or ask at the counter."
      action={{ href: "/", label: "Back to the canteen home" }}
    />
  );
}
