import { ToastProvider } from "@/components/ui/Toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
