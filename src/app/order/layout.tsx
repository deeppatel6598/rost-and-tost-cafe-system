import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/components/ui/Toast";

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-surface="roast" className="min-h-screen bg-[#0a0909]">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-roast-600 bg-bg text-text">
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
      </div>
    </div>
  );
}
