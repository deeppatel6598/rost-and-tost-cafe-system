import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getSettings, updateSettings } from "@/lib/store/settings";

export async function GET() {
  return NextResponse.json({ settings: getSettings() });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let patch;
  try {
    patch = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const settings = updateSettings(patch);
  return NextResponse.json({ settings });
}
