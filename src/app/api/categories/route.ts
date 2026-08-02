import { NextResponse } from "next/server";
import { listCategories } from "@/lib/store/categories";

export async function GET() {
  return NextResponse.json({ categories: listCategories() });
}
