import { NextRequest, NextResponse } from "next/server";
import { DocDirection, DocStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentSession, isStaffRole, getClientIp } from "@/lib/auth";
import { createDocumentSchema } from "@/lib/validations";
import { nextSequence } from "@/lib/sequence";

const VALID_DOC_STATUSES = new Set<string>([
  "CHO_BUT_PHE",
  "DANG_XU_LY",
  "CHO_KY_BAN_HANH",
  "DA_BAN_HANH",
  "LUU_TRU",
]);

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json(
      { error: "Chỉ cán bộ nội bộ mới được truy cập Sổ Quản lý Văn bản Điều hành." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const andClauses: Prisma.OfficialDocumentWhereInput[] = [];

  // Kiểm soát bảo mật văn bản MẬT / TỐI MẬT theo Nghị định 30/2020/NĐ-CP:
  // Chỉ Lãnh đạo, Quản trị, người khởi tạo văn bản hoặc chuyên viên được đích danh phân công mới được truy cập.
  if (session.role !== "LANH_DAO" && session.role !== "QUAN_TRI") {
    andClauses.push({
      OR: [
        { security: "THUONG" },
        { createdById: session.userId },
        { assigneeId: session.userId },
      ],
    });
  }

  if (direction === "DEN" || direction === "DI") {
    andClauses.push({ direction: direction as DocDirection });
  }
  if (status && status !== "ALL" && VALID_DOC_STATUSES.has(status)) {
    andClauses.push({ status: status as DocStatus });
  }
  if (q) {
    andClauses.push({
      OR: [
        { documentSymbol: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { issuingAgency: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const documents = await prisma.officialDocument.findMany({
    where: andClauses.length > 0 ? { AND: andClauses } : {},
    include: {
      leadDepartment: { select: { id: true, code: true, name: true } },
      assignee: { select: { id: true, fullName: true, positionTitle: true } },
      linkedDossier: { select: { id: true, dossierCode: true, applicantName: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json(
      { error: "Không có quyền đăng ký văn bản hành chính." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Thông tin văn bản không hợp lệ" },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const cleanSymbol = d.documentSymbol.trim().toUpperCase();
    const existing = await prisma.officialDocument.findUnique({
      where: { documentSymbol: cleanSymbol },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Số ký hiệu văn bản "${cleanSymbol}" đã tồn tại trong Sổ đăng ký.` },
        { status: 409 }
      );
    }

    const initialStatus: DocStatus =
      d.direction === "DEN"
        ? d.leadDepartmentId
          ? "DANG_XU_LY"
          : "CHO_BUT_PHE"
        : session.role === "LANH_DAO"
        ? "DA_BAN_HANH"
        : "CHO_KY_BAN_HANH";

    const year = new Date(d.issuedDate).getFullYear() || new Date().getFullYear();

    const doc = await prisma.$transaction(async (tx) => {
      const nextIncomingNumber =
        d.direction === "DEN" ? await nextSequence(tx, `DOC_DEN_${year}`, 419) : null;
      const nextOutgoingNumber =
        d.direction === "DI" && initialStatus === "DA_BAN_HANH"
          ? await nextSequence(tx, `DOC_DI_${year}`, 103)
          : null;

      const created = await tx.officialDocument.create({
        data: {
          direction: d.direction,
          incomingNumber: nextIncomingNumber,
          outgoingNumber: nextOutgoingNumber,
          documentSymbol: cleanSymbol,
          docType: d.docType,
          urgency: d.urgency,
          security: d.security,
          status: initialStatus,
          title: d.title,
          contentSummary: d.contentSummary,
          issuingAgency: d.issuingAgency,
          recipientAgency: d.recipientAgency,
          signerName: d.signerName || (session.role === "LANH_DAO" ? session.fullName : null),
          signerTitle: d.signerTitle || (session.role === "LANH_DAO" ? session.positionTitle : null),
          issuedDate: new Date(d.issuedDate),
          receivedDate: d.direction === "DEN" ? new Date() : null,
          processingDeadline: d.processingDeadline ? new Date(d.processingDeadline) : null,
          leadDepartmentId: d.leadDepartmentId || null,
          assigneeId: d.assigneeId || null,
          createdById: session.userId,
        },
        include: {
          leadDepartment: true,
          assignee: { select: { id: true, fullName: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          actorName: session.fullName,
          actorRole: session.role,
          action: d.direction === "DEN" ? "VAO_SO_VB_DEN" : "DU_THAO_VB_DI",
          entityType: "DOCUMENT",
          entityCode: created.documentSymbol,
          detail: `${
            d.direction === "DEN"
              ? `Vào sổ văn bản đến số ${nextIncomingNumber}`
              : nextOutgoingNumber
              ? `Ban hành văn bản đi số ${nextOutgoingNumber}`
              : "Tạo dự thảo văn bản đi"
          } (${d.security}): ${created.title}`,
          ipAddress: getClientIp(req),
        },
      });

      return created;
    });

    return NextResponse.json({ ok: true, document: doc }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_DOCUMENT_ERROR]", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi lưu văn bản" }, { status: 500 });
  }
}
