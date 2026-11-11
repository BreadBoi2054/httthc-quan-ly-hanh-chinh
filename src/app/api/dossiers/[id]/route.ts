import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSession, isStaffRole } from "@/lib/auth";
import { evaluateDossierSla } from "@/lib/sla-engine";
import { getAvailableActions } from "@/lib/workflow-engine";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getCurrentSession();
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get("pin")?.trim();

  const dossier = await prisma.dossier.findFirst({
    where: {
      OR: [{ id }, { dossierCode: id }],
    },
    include: {
      procedure: true,
      department: true,
      receiver: { select: { id: true, fullName: true, positionTitle: true } },
      assignee: { select: { id: true, fullName: true, positionTitle: true } },
      approver: { select: { id: true, fullName: true, positionTitle: true } },
      attachments: { orderBy: { createdAt: "asc" } },
      histories: { orderBy: { createdAt: "asc" } },
      linkedDocuments: true,
    },
  });

  if (!dossier) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ hành chính." }, { status: 404 });
  }

  const hasStaffAccess = session && isStaffRole(session.role);
  const isCrossDeptSpecialist =
    session &&
    session.role === "CHUYEN_VIEN" &&
    Boolean(session.departmentId && session.departmentId !== dossier.departmentId);
  const isAuthorizedStaff = Boolean(hasStaffAccess && !isCrossDeptSpecialist);
  const isOwnerCitizen = session && session.role === "CONG_DAN" && dossier.applicantId === session.userId;
  const hasValidPin = Boolean(pin && pin === dossier.trackingPin);

  if (!isAuthorizedStaff && !isOwnerCitizen && !hasValidPin) {
    return NextResponse.json(
      {
        error: isCrossDeptSpecialist
          ? `Kiểm soát phân quyền ABAC: Chuyên viên thuộc [${session?.departmentName}] không được phép truy cập hồ sơ thuộc thẩm quyền [${dossier.department.name}].`
          : "Bạn không có quyền xem chi tiết hồ sơ này. Vui lòng đăng nhập hoặc cung cấp đúng Mã PIN tra cứu trên Giấy tiếp nhận.",
      },
      { status: 403 }
    );
  }

  const sla = evaluateDossierSla({
    status: dossier.status,
    dueAt: dossier.dueAt,
    completedAt: dossier.completedAt,
    slaPausedAt: dossier.slaPausedAt,
    supplementDeadline: dossier.supplementDeadline,
  });

  const availableActions = session
    ? getAvailableActions({
        role: session.role,
        userId: session.userId,
        userDepartmentId: session.departmentId,
        dossierDepartmentId: dossier.departmentId,
        applicantId: dossier.applicantId,
        status: dossier.status,
        feeAmount: dossier.feeAmount,
        feeExempt: dossier.feeExempt,
        feeStatus: dossier.feeStatus,
        supplementCount: dossier.supplementCount,
        extendedCount: dossier.extendedCount,
      })
    : [];

  // Danh sách chuyên viên thuộc bộ phận chuyên môn để Một cửa / Lãnh đạo phân công
  const specialists = hasStaffAccess
    ? await prisma.user.findMany({
        where: {
          role: "CHUYEN_VIEN",
          departmentId: dossier.departmentId,
          isActive: true,
        },
        select: { id: true, fullName: true, positionTitle: true },
      })
    : [];

  return NextResponse.json({
    dossier: {
      ...dossier,
      procedure: {
        ...dossier.procedure,
        requiredDocs: JSON.parse(dossier.procedure.requiredDocsJson || "[]"),
      },
      sla,
      availableActions,
      specialists,
    },
  });
}
