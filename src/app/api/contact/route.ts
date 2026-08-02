import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createContactMessage, listContactMessages } from "@/lib/store/contact";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  return NextResponse.json({ messages: listContactMessages() });
}

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
    return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 });
  }

  const msg = createContactMessage({ name: body.name.trim(), email: body.email.trim(), message: body.message.trim() });
  return NextResponse.json({ message: msg }, { status: 201 });
}
