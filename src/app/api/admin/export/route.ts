import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listUsers } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return new NextResponse("Interdit", { status: 403 });
  const rows = (await listUsers()).filter((u) => u.role !== "admin");
  const head = ["N°", "Nom", "E-mail", "Formule", "Statut", "Fin", "Créé le"];
  const csv = [head.join(";")]
    .concat(
      rows.map((u) =>
        [u.subscriberNo, u.name, u.email, u.plan || "", u.status, u.currentPeriodEnd || "", u.createdAt || ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(";")
      )
    )
    .join("\n");
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="abonnes-le-point-chablais.csv"`,
    },
  });
}
