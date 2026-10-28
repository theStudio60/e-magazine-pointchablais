import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getUserById, getInvoiceById, getSettings } from "@/lib/db";
import { invoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getSessionUserId();
  const user = uid ? await getUserById(uid) : undefined;
  if (!user) return new NextResponse("Non connecté", { status: 401 });

  const { id } = await ctx.params;
  const inv = await getInvoiceById(id);
  // Un abonné ne télécharge que SES factures (l'admin peut tout).
  if (!inv || (user.role !== "admin" && inv.userId !== user.id)) return new NextResponse("Introuvable", { status: 404 });

  const { site } = await getSettings();
  const pdf = await invoicePdf(inv, user, site);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="facture-${inv.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}