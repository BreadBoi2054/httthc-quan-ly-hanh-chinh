import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { DossierStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentSession, isStaffRole, getClientIp } from "@/lib/auth";
import { createDossierSchema } from "@/lib/validations";
import { calculateDueDate, evaluateDossierSla, toVnDateKey } from "@/lib/sla-engine";
import { pickLeastLoadedSpecialist } from "@/lib/specialist-assignment";
import { nextSequence } from "@/lib/sequence";

const VALID_DOSSIER_STATUSES = new Set<string>([
  "MOI_NOP",
  "DA_TIEP_NHAN",
  "YEU_CAU_BO_SUNG",
  "DANG_THAM_DINH",
  "CHO_PHE_DUYET",
  "CHO_TRA_KET_QUA",
  "HOAN_THANH",
  "TU_CHOI_TIEP_NHAN",
  "DA_RUT_HO_SO",
]);

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để truy cập danh sách hồ sơ." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);

  // Kho quản lý dữ liệu điện tử của cá nhân / tổ chức (Điều 11 Nghị định 45/2020/NĐ-CP)
  if (searchParams.get("vault") === "1") {
    const citizenDossiers = await prisma.dossier.findMany({
      where: { applicantId: session.userId },
      include: {
        procedure: { select: { code: true, name: true, resultTemplate: true } },
        attachments: { where: { isVerified: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const vaultItems: Array<{
      id: string;
      sourceType: "KET_QUA_DIEN_TU" | "GIAY_TO_SO_HOA";
      code: string;
      title: string;
      fileName: string;
      issuedInfo: string;
    }> = [];
    const seenKeys = new Set<string>();

    for (const ds of citizenDossiers) {
      if (ds.isDigitizedResult && ds.resultDocNumber) {
        const key = `RES:${ds.resultDocNumber}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const safeSymbol = ds.resultDocNumber.replace(/[^A-Za-z0-9_-]/g, "_");
          vaultItems.push({
            id: `res-${ds.id}`,
            sourceType: "KET_QUA_DIEN_TU",
            code: ds.electronicResultCode || ds.resultDocNumber,
            title: `${ds.procedure.resultTemplate} (${ds.resultDocNumber})`,
            fileName: `KetQuaDienTu_${safeSymbol}.pdf`,
            issuedInfo: `Hồ sơ ${ds.dossierCode} • Ký số UBND Phường Thanh Nhàn`,
          });
        }
      }
      for (const att of ds.attachments) {
        const key = `ATT:${att.docCode}:${att.fileName || att.docName}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          vaultItems.push({
            id: `att-${att.id}`,
            sourceType: "GIAY_TO_SO_HOA",
            code: att.docCode,
            title: att.docName,
            fileName: att.fileName || `${att.docCode}_KhoSoHoa.pdf`,
            issuedInfo: `Đã đối chiếu hợp lệ từ hồ sơ ${ds.dossierCode}`,
          });
        }
      }
    }

    return NextResponse.json({ vaultItems });
  }

  const statusParam = searchParams.get("status");
  const departmentId = searchParams.get("departmentId");
  const slaFilter = searchParams.get("sla");
  const scope = searchParams.get("scope");
  const q = searchParams.get("q")?.trim();

  const where: Prisma.DossierWhereInput = {};

  if (!isStaffRole(session.role)) {
    where.applicantId = session.userId;
  } else if (session.role === "CHUYEN_VIEN" && session.departmentId) {
    // Kiểm soát ABAC nghiêm ngặt: Chuyên viên chỉ được truy xuất sổ hồ sơ thuộc đúng phòng ban chuyên môn của mình
    where.departmentId = session.departmentId;
  } else {
    if (departmentId && departmentId !== "ALL") {
      where.departmentId = departmentId;
    } else if (scope !== "all" && session.departmentId && session.role !== "LANH_DAO" && session.role !== "QUAN_TRI" && session.role !== "MOT_CUA") {
      where.departmentId = session.departmentId;
    }
  }

  if (statusParam && statusParam !== "ALL") {
    if (!VALID_DOSSIER_STATUSES.has(statusParam)) {
      return NextResponse.json(
        { error: "Trạng thái lọc hồ sơ không hợp lệ." },
        { status: 400 }
      );
    }
    where.status = statusParam as DossierStatus;
  }

  if (q) {
    where.OR = [
      { dossierCode: { contains: q, mode: "insensitive" } },
      { applicantName: { contains: q, mode: "insensitive" } },
      { applicantCitizenId: { contains: q, mode: "insensitive" } },
      { applicantPhone: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  const dossiers = await prisma.dossier.findMany({
    where,
    include: {
      procedure: { select: { id: true, code: true, name: true, field: true, processingDays: true } },
      department: { select: { id: true, code: true, name: true } },
      assignee: { select: { id: true, fullName: true, positionTitle: true } },
      receiver: { select: { id: true, fullName: true } },
      _count: { select: { attachments: true } },
    },
    orderBy: [{ submittedAt: "desc" }],
  });

  const now = new Date();
  const enriched = dossiers
    .map((d) => ({
      ...d,
      sla: evaluateDossierSla({
        status: d.status,
        dueAt: d.dueAt,
        completedAt: d.completedAt,
        slaPausedAt: d.slaPausedAt,
        supplementDeadline: d.supplementDeadline,
        now,
      }),
    }))
    .filter((item) => {
      if (!slaFilter || slaFilter === "ALL") return true;
      if (slaFilter === "QUA_HAN")
        return item.sla.state === "QUA_HAN" || item.sla.state === "QUA_HAN_BO_SUNG";
      if (slaFilter === "SAP_DEN_HAN") return item.sla.state === "SAP_DEN_HAN";
      if (slaFilter === "TRONG_HAN") return item.sla.state === "TRONG_HAN";
      return true;
    });

  return NextResponse.json({ dossiers: enriched });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const body = await req.json();
    const parsed = createDossierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu hồ sơ chưa hợp lệ", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const procedure = await prisma.procedure.findUnique({
      where: { id: input.procedureId },
      include: { department: true },
    });

    if (!procedure || !procedure.isActive) {
      return NextResponse.json(
        { error: "Thủ tục hành chính không tồn tại hoặc đang tạm ngưng tiếp nhận." },
        { status: 404 }
      );
    }

    // Kiểm tra chặt thành phần hồ sơ bắt buộc theo Danh mục TTHC công bố
    const requiredDocs: Array<{ code: string; name: string; mandatory: boolean }> = JSON.parse(
      procedure.requiredDocsJson || "[]"
    );
    const submittedCodes = new Set(input.attachments.map((a) => a.docCode));
    const missingMandatory = requiredDocs.filter((doc) => doc.mandatory && !submittedCodes.has(doc.code));

    if (missingMandatory.length > 0) {
      return NextResponse.json(
        {
          error: `Hồ sơ còn thiếu thành phần bắt buộc theo quy định: ${missingMandatory
            .map((m) => m.name)
            .join("; ")}.`,
        },
        { status: 422 }
      );
    }

    // Kênh nộp trực tiếp / bưu chính chỉ dành cho Cán bộ Một cửa hoặc Quản trị
    const isIntakeOfficer =
      Boolean(session && (session.role === "MOT_CUA" || session.role === "QUAN_TRI"));
    const effectiveChannel = isIntakeOfficer ? input.channel : "TRUC_TUYEN";
    const shouldAutoAccept = Boolean(
      isIntakeOfficer && effectiveChannel !== "TRUC_TUYEN" && input.autoAccept
    );

    const calculatedFee =
      input.feeExempt || procedure.feeAmount <= 0
        ? 0
        : procedure.feePerCopy
        ? procedure.feeAmount * input.copiesCount
        : procedure.feeAmount;

    const feeStatus = calculatedFee === 0 ? "MIEN_PHI" : "CHUA_THU_PHI";

    const now = new Date();
    const dateCompact = toVnDateKey(now).replace(/-/g, "");
    const trackingPin = String(randomInt(100000, 1000000));
    const holidays = shouldAutoAccept
      ? await prisma.holiday.findMany({ select: { dateStr: true } })
      : [];
    const holidayDates = holidays.map((h) => h.dateStr);

    const created = await prisma.$transaction(async (tx) => {
      const year = now.getFullYear();
      let seq = await nextSequence(tx, `DOSSIER_${year}`, 10);
      let dossierCode = `HS-${dateCompact}-${String(seq).padStart(4, "0")}`;

      while (await tx.dossier.findUnique({ where: { dossierCode } })) {
        seq = await nextSequence(tx, `DOSSIER_${year}`, seq);
        dossierCode = `HS-${dateCompact}-${String(seq).padStart(4, "0")}`;
      }

      const applicantId =
        session && session.role === "CONG_DAN" ? session.userId : null;

      const actorName = session ? session.fullName : input.applicantName;
      const actorRole = session ? session.role : "CONG_DAN";

      const dueAt = shouldAutoAccept
        ? calculateDueDate(
            now,
            procedure.processingDays,
            procedure.processingHours,
            holidayDates
          )
        : null;
      const autoAssigneeId = shouldAutoAccept
        ? await pickLeastLoadedSpecialist(tx, procedure.departmentId)
        : null;

      const historyEntries: Prisma.DossierHistoryCreateWithoutDossierInput[] = [
        {
          fromStatus: null,
          toStatus: "MOI_NOP",
          actionName:
            effectiveChannel === "TRUC_TUYEN"
              ? "Nộp hồ sơ trực tuyến"
              : "Đăng ký hồ sơ tại Bộ phận Một cửa",
          actorId: session?.userId ?? null,
          actorName,
          actorRole,
          note: `Gửi yêu cầu giải quyết TTHC [${procedure.code}] - ${procedure.name}.`,
          createdAt: now,
        },
      ];

      if (shouldAutoAccept && dueAt) {
        historyEntries.push({
          fromStatus: "MOI_NOP",
          toStatus: "DA_TIEP_NHAN",
          actionName: "Tiếp nhận & Cấp giấy hẹn (Mẫu 01)",
          actorId: session?.userId ?? null,
          actorName,
          actorRole,
          note: `Tiếp nhận hợp lệ ngay tại quầy Một cửa, cấp Mẫu 01. Hạn trả: ${dueAt.toLocaleString("vi-VN")}.`,
          createdAt: new Date(now.getTime() + 1000),
        });
      }

      const dossier = await tx.dossier.create({
        data: {
          dossierCode,
          trackingPin,
          procedureId: procedure.id,
          departmentId: procedure.departmentId,
          applicantId,
          applicantName: input.applicantName,
          applicantCitizenId: input.applicantCitizenId,
          applicantPhone: input.applicantPhone,
          applicantEmail: input.applicantEmail || null,
          applicantAddress: input.applicantAddress,
          applicantBirthYear: input.applicantBirthYear || null,
          representativeName: input.hasAuthorization ? input.representativeName || null : null,
          representativeCitizenId: input.hasAuthorization ? input.representativeCitizenId || null : null,
          authorizationNote: input.hasAuthorization ? input.authorizationNote || null : null,
          channel: effectiveChannel,
          status: shouldAutoAccept ? "DA_TIEP_NHAN" : "MOI_NOP",
          summary: input.summary,
          copiesCount: input.copiesCount,
          feeAmount: calculatedFee,
          feeExempt: input.feeExempt || procedure.feeAmount === 0,
          feeExemptReason:
            input.feeExempt
              ? input.feeExemptReason || "Đối tượng miễn phí theo quy định"
              : procedure.feeAmount === 0
              ? procedure.feeExemptionNote || "Thủ tục miễn phí"
              : null,
          feeStatus,
          submittedAt: now,
          acceptedAt: shouldAutoAccept ? now : null,
          dueAt,
          receiverId: shouldAutoAccept && session ? session.userId : null,
          assigneeId: autoAssigneeId,
          attachments: {
            create: input.attachments.map((att) => ({
              docCode: att.docCode,
              docName: att.docName,
              isMandatory: att.isMandatory,
              submittedType: att.submittedType,
              quantity: att.quantity,
              fileName: att.fileName,
              isVerified: shouldAutoAccept,
              reusedFromVault: Boolean(att.reusedFromVault),
            })),
          },
          histories: {
            create: historyEntries,
          },
        },
        include: {
          procedure: true,
          department: true,
          attachments: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: session?.userId ?? null,
          actorName,
          actorRole,
          action: "NOP_HO_SO",
          entityType: "DOSSIER",
          entityCode: dossier.dossierCode,
          detail: `Tạo mới hồ sơ ${dossier.dossierCode} (${effectiveChannel}) cho người yêu cầu ${dossier.applicantName}.`,
          ipAddress: getClientIp(req),
        },
      });

      return dossier;
    });

    return NextResponse.json(
      {
        ok: true,
        dossier: created,
        trackingInfo: {
          dossierCode: created.dossierCode,
          trackingPin: created.trackingPin,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CREATE_DOSSIER_ERROR]", error);
    return NextResponse.json({ error: "Không thể khởi tạo hồ sơ hành chính" }, { status: 500 });
  }
}
