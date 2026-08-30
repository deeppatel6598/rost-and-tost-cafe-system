import { NextRequest, NextResponse } from "next/server";
import { requireStallScope } from "@/lib/api-auth";
import { advanceStatus, OrderError } from "@/lib/store/orders";

export const dynamic = "force-dynamic";

interface Params {
  params: { subOrderId: string };
}

/** One tap = one transition along PLACED → ACCEPTED → PREPARING → READY → COMPLETED. */
export async function POST(request: NextRequest, { params }: Params) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  try {
    const subOrder = advanceStatus(scope.stallId, params.subOrderId);
    return NextResponse.json({ subOrder });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }
}
