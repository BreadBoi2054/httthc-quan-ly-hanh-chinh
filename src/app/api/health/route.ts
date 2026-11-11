import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [proceduresCount, dossiersCount, documentsCount, departmentsCount] = await Promise.all([
      prisma.procedure.count(),
      prisma.dossier.count(),
      prisma.officialDocument.count(),
      prisma.department.count(),
    ]);

    return NextResponse.json({
      ok: true,
      service: "HTTTHC - He thong Thong tin Quan ly Hanh chinh",
      database: "connected",
      counts: {
        departments: departmentsCount,
        procedures: proceduresCount,
        dossiers: dossiersCount,
        documents: documentsCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[HEALTH_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Khong the ket noi Co so du lieu" },
      { status: 500 }
    );
  }
}
