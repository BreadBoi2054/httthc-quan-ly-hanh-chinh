import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateDossierSla } from "@/lib/sla-engine";

export async function GET() {
  const [departments, procedures, dossiers, documents] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.procedure.findMany({ where: { isActive: true } }),
    prisma.dossier.findMany({
      include: {
        department: { select: { id: true, code: true, name: true } },
        procedure: { select: { id: true, code: true, field: true, serviceLevel: true } },
        attachments: { select: { submittedType: true, reusedFromVault: true } },
      },
    }),
    prisma.officialDocument.findMany(),
  ]);

  const now = new Date();
  let completedTotal = 0;
  let completedOnTime = 0;
  let completedLate = 0;
  let activeProcessing = 0;
  let rejectedOrWithdrawnCount = 0;
  let overdueActive = 0;
  let warningActive = 0;
  let pausedSupplement = 0;
  let onlineSubmissions = 0;
  let paidFeeDossiers = 0;
  let onlinePaidDossiers = 0;
  let digitizedInputDossiers = 0;
  let signedOrCompletedTotal = 0;
  let digitizedResultDossiers = 0;
  let vaultReuseCount = 0;
  let collectedFeeTotal = 0;
  let pendingFeeTotal = 0;
  let ratedCount = 0;
  let positiveRatedCount = 0;

  const statusCounts: Record<string, number> = {
    MOI_NOP: 0,
    DA_TIEP_NHAN: 0,
    YEU_CAU_BO_SUNG: 0,
    DANG_THAM_DINH: 0,
    CHO_PHE_DUYET: 0,
    CHO_TRA_KET_QUA: 0,
    HOAN_THANH: 0,
    TU_CHOI_TIEP_NHAN: 0,
    DA_RUT_HO_SO: 0,
  };

  const deptStatsMap = new Map<
    string,
    {
      id: string;
      code: string;
      name: string;
      total: number;
      completed: number;
      processing: number;
      overdue: number;
      rejectedOrWithdrawn: number;
    }
  >();

  for (const dept of departments) {
    deptStatsMap.set(dept.id, {
      id: dept.id,
      code: dept.code,
      name: dept.name,
      total: 0,
      completed: 0,
      processing: 0,
      overdue: 0,
      rejectedOrWithdrawn: 0,
    });
  }

  for (const d of dossiers) {
    statusCounts[d.status] = (statusCounts[d.status] ?? 0) + 1;
    if (d.channel === "TRUC_TUYEN") {
      onlineSubmissions += 1;
    }
    if (d.feeStatus === "DA_THU_PHI") {
      collectedFeeTotal += d.feeAmount;
      paidFeeDossiers += 1;
      if (d.paymentMethod === "TRUC_TUYEN") {
        onlinePaidDossiers += 1;
      }
    } else if (
      d.feeStatus === "CHUA_THU_PHI" &&
      d.status !== "TU_CHOI_TIEP_NHAN" &&
      d.status !== "DA_RUT_HO_SO"
    ) {
      pendingFeeTotal += d.feeAmount;
    }

    const hasElectronicInput = d.attachments.some(
      (att) => att.submittedType === "BAN_DIEN_TU" || att.reusedFromVault
    );
    if (hasElectronicInput) {
      digitizedInputDossiers += 1;
    }
    vaultReuseCount += d.attachments.filter((att) => att.reusedFromVault).length;

    if (d.status === "CHO_TRA_KET_QUA" || d.status === "HOAN_THANH") {
      signedOrCompletedTotal += 1;
      if (d.isDigitizedResult) {
        digitizedResultDossiers += 1;
      }
    }

    if (d.satisfactionRating) {
      ratedCount += 1;
      if (d.satisfactionRating === "RAT_HAI_LONG" || d.satisfactionRating === "HAI_LONG") {
        positiveRatedCount += 1;
      }
    }

    const sla = evaluateDossierSla({
      status: d.status,
      dueAt: d.dueAt,
      completedAt: d.completedAt,
      slaPausedAt: d.slaPausedAt,
      supplementDeadline: d.supplementDeadline,
      now,
    });

    const deptStat = deptStatsMap.get(d.departmentId);
    if (deptStat) {
      deptStat.total += 1;
    }

    if (d.status === "HOAN_THANH") {
      completedTotal += 1;
      if (sla.state === "DA_HOAN_THANH_DUNG_HAN") {
        completedOnTime += 1;
      } else {
        completedLate += 1;
      }
      if (deptStat) deptStat.completed += 1;
    } else if (d.status === "TU_CHOI_TIEP_NHAN" || d.status === "DA_RUT_HO_SO") {
      rejectedOrWithdrawnCount += 1;
      if (deptStat) deptStat.rejectedOrWithdrawn += 1;
    } else {
      activeProcessing += 1;
      if (deptStat) deptStat.processing += 1;
      if (d.status === "YEU_CAU_BO_SUNG") {
        pausedSupplement += 1;
        if (sla.isOverdue) {
          overdueActive += 1;
          if (deptStat) deptStat.overdue += 1;
        }
      } else if (sla.isOverdue) {
        overdueActive += 1;
        if (deptStat) deptStat.overdue += 1;
      } else if (sla.state === "SAP_DEN_HAN") {
        warningActive += 1;
      }
    }
  }

  const totalDossiers = dossiers.length;
  const fullOnlineProcedures = procedures.filter((p) => p.serviceLevel === "TOAN_TRINH").length;

  // Tính toán Bộ chỉ số 5 nhóm trụ cột chuẩn Quyết định 766/QĐ-TTg từ dữ liệu thực:
  // 1. Công khai, minh bạch (18%)
  const transparencyRate = procedures.length > 0 ? 100 : 0;
  // 2. Tiến độ, kết quả giải quyết (20%)
  const onTimeRate =
    completedTotal + overdueActive > 0
      ? Math.round((completedOnTime / (completedTotal + overdueActive)) * 1000) / 10
      : 100;
  // 3. Dịch vụ công trực tuyến & Thanh toán trực tuyến (22%)
  const onlineSubmissionRate =
    totalDossiers > 0 ? Math.round((onlineSubmissions / totalDossiers) * 1000) / 10 : 0;
  const onlinePaymentRate =
    paidFeeDossiers > 0 ? Math.round((onlinePaidDossiers / paidFeeDossiers) * 1000) / 10 : 100;
  const onlineAndPaymentRate = Math.round(((onlineSubmissionRate + onlinePaymentRate) / 2) * 10) / 10;
  // 4. Số hóa hồ sơ & Kết quả giải quyết TTHC điện tử (22%)
  const inputDigitizationRate =
    totalDossiers > 0 ? (digitizedInputDossiers / totalDossiers) * 100 : 100;
  const resultDigitizationRate =
    signedOrCompletedTotal > 0
      ? (digitizedResultDossiers / signedOrCompletedTotal) * 100
      : 100;
  const digitizationRate =
    Math.round(((inputDigitizationRate + resultDigitizationRate) / 2) * 10) / 10;
  // 5. Mức độ hài lòng SIPAS (18%)
  const satisfactionRate =
    ratedCount > 0 ? Math.round((positiveRatedCount / ratedCount) * 1000) / 10 : 100;

  const fullProcessCatalogRate =
    procedures.length > 0
      ? Math.round((fullOnlineProcedures / procedures.length) * 1000) / 10
      : 0;

  const index766Score =
    Math.round(
      (transparencyRate * 0.18 +
        onTimeRate * 0.2 +
        onlineAndPaymentRate * 0.22 +
        digitizationRate * 0.22 +
        satisfactionRate * 0.18) *
        10
    ) / 10;

  return NextResponse.json({
    generatedAt: now.toISOString(),
    summary: {
      totalProcedures: procedures.length,
      fullOnlineProcedures,
      totalDossiers,
      completedTotal,
      completedOnTime,
      completedLate,
      activeProcessing,
      rejectedOrWithdrawnCount,
      overdueActive,
      warningActive,
      pausedSupplement,
      onlineSubmissions,
      paidFeeDossiers,
      onlinePaidDossiers,
      digitizedInputDossiers,
      digitizedResultDossiers,
      vaultReuseCount,
      collectedFeeTotal,
      pendingFeeTotal,
      ratedCount,
      positiveRatedCount,
      incomingDocs: documents.filter((doc) => doc.direction === "DEN").length,
      outgoingDocs: documents.filter((doc) => doc.direction === "DI").length,
      pendingDirectiveDocs: documents.filter((doc) => doc.status === "CHO_BUT_PHE").length,
    },
    index766: {
      overallScore: index766Score,
      transparencyRate,
      onTimeRate,
      onlineSubmissionRate,
      onlinePaymentRate,
      onlineAndPaymentRate,
      digitizationRate,
      fullProcessCatalogRate,
      satisfactionRate,
    },
    statusCounts,
    departmentBreakdown: Array.from(deptStatsMap.values()).filter(
      (d) => d.code !== "BP-MC" || d.total > 0
    ),
  });
}
