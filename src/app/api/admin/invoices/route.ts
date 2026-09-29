import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listInvoices } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const q = (new URL(req.url).searchParams.get("q") || "").toLowerCase().trim();
  let rows = await listInvoices();
  if (q) rows = rows.filter((i) => (i.number + " " + i.userName + " " + i.userEmail).toLowerCase().includes(q));
  return NextResponse.json({ invoices: rows });
}
