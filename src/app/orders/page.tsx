import { MyOrdersClient } from "@/components/order/MyOrdersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "My orders" };

export default function MyOrdersPage() {
  return (
    <div data-surface="roast" className="min-h-screen bg-[#0a0909]">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-roast-600 bg-bg text-text">
        <MyOrdersClient />
      </div>
    </div>
  );
}
