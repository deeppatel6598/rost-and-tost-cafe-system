import { StatusClient } from "@/components/order/StatusClient";
import { ToastProvider } from "@/components/ui/Toast";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your order" };

interface Params {
  params: { publicToken: string };
}

export default function StatusPage({ params }: Params) {
  return (
    <div data-surface="roast" className="min-h-screen bg-[#0a0909]">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-roast-600 bg-bg text-text">
        <ToastProvider>
          <StatusClient publicToken={params.publicToken} />
        </ToastProvider>
      </div>
    </div>
  );
}
