import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listLogs } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  return NextResponse.json({ logs: (await listLogs()).slice(0, 200) });
}
