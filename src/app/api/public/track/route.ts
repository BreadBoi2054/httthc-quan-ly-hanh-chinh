import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/auth";
import {
  calculateDueDate,
  calculateWorkingMinutesBetween,
  compensatePausedDuration,
  evaluateDossierSla,
} from "@/lib/sla-engine";
import { satisfactionSchema } from "@/lib/validations";
import { nextSequence } from "@/lib/sequence";
import { pickLeastLoadedSpecialist } from "@/lib/specialist-assignment";

const publicPinActionSchema = z.object({
  dossierCode: z.string().trim().min(5),
  trackingPin: z.string().trim().min(4),
  action: z.enum(["THU_LE_PHI", "BO_SUNG_HO_SO", "RUT_HO_SO"]),
  newAttachmentName: z.string().trim().optional(),
  note: z.string().trim().max(400).optional(),
});

function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return `${fullName.slice(0, 1)}***`;
  return `${parts.slice(0, -1).join(" ")} ***`;
}

function maskCitizenId(cid: string): string {
  if (cid.length < 6) return "***";
  return `${cid.slice(0, 4)}*****${cid.slice(-3)}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();
  const pin = searchParams.get("pin")?.trim();

  if (!code) {
    return NextResponse.json(
      { error: "Vui lòng nhập Mã số hồ sơ biên nhận (ví dụ: HS-20261111-0001)" },
      { status: 400 }
    );
  }

  const dossier = await prisma.dossier.findUnique({
    where: { dossierCode: code },
    include: {
      procedure: { select: { code: true, name: true, field: true, processingDays: true, processingHours: true } },
      department: { select: { code: true, name: true, roomNumber: true, phoneExt: true } },
      receiver: { select: { fullName: true, positionTitle: true } },
      approver: { select: { fullName: true, positionTitle: true } },
      histories: { orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!dossier) {
    return NextResponse.json(
      { error: `Không tìm thấy hồ sơ mang mã biên nhận "${code}". Vui lòng kiểm tra lại Giấy tiếp nhận.` },
      { status: 404 }
    );
  }

  const sla = evaluateDossierSla({
    status: dossier.status,
    dueAt: dossier.dueAt,
    completedAt: dossier.completedAt,
    slaPausedAt: dossier.slaPausedAt,
    supplementDeadline: dossier.supplementDeadline,
  });

  const pinVerified = Boolean(pin && pin === dossier.trackingPin);

  if (!pinVerified) {
    return NextResponse.json({
      pinVerified: false,
      dossier: {
        id: dossier.id,
        dossierCode: dossier.dossierCode,
        status: dossier.status,
        channel: dossier.channel,
        applicantNameMasked: maskName(dossier.applicantName),
        applicantCitizenIdMasked: maskCitizenId(dossier.applicantCitizenId),
        procedure: dossier.procedure,
        department: dossier.department,
        submittedAt: dossier.submittedAt,
        acceptedAt: dossier.acceptedAt,
        dueAt: dossier.dueAt,
        completedAt: dossier.completedAt,
        feeAmount: dossier.feeAmount,
        feeStatus: dossier.feeStatus,
        extendedCount: dossier.extendedCount,
        apologyFormCode: dossier.apologyFormCode,
        resultDocNumber: dossier.resultDocNumber,
        isDigitizedResult: dossier.isDigitizedResult,
        satisfactionRating: dossier.satisfactionRating,
        sla,
        histories: dossier.histories.map((h) => ({
          id: h.id,
          toStatus: h.toStatus,
          actionName: h.actionName,
          actorRole: h.actorRole,
          createdAt: h.createdAt,
        })),
      },
    });
  }

  return NextResponse.json({
    pinVerified: true,
    dossier: {
      ...dossier,
      sla,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = String(body.dossierCode || "").trim().toUpperCase();
    const parsed = satisfactionSchema.safeParse(body);

    if (!code || !parsed.success) {
      return NextResponse.json(
        { error: parsed.error?.issues[0]?.message || "Thông tin đánh giá hài lòng không hợp lệ" },
        { status: 400 }
      );
    }

    const dossier = await prisma.dossier.findUnique({ where: { dossierCode: code } });
    if (!dossier) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ để đánh giá." }, { status: 404 });
    }

    if (dossier.trackingPin !== parsed.data.trackingPin) {
      return NextResponse.json(
        { error: "Mã PIN xác thực trên Giấy tiếp nhận không chính xác." },
        { status: 403 }
      );
    }

    if (dossier.status !== "HOAN_THANH") {
      return NextResponse.json(
        { error: "Chỉ thực hiện khảo sát mức độ hài lòng sau khi hồ sơ đã hoàn thành trả kết quả." },
        { status: 422 }
      );
    }

    if (dossier.satisfactionRating !== null) {
      return NextResponse.json(
        { error: "Hồ sơ này đã được khảo sát đánh giá mức độ hài lòng trước đó, không thể ghi đè." },
        { status: 409 }
      );
    }

    const updated = await prisma.dossier.update({
      where: { id: dossier.id },
      data: {
        satisfactionRating: parsed.data.rating,
        satisfactionComment: parsed.data.comment || null,
        ratedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorName: dossier.applicantName,
        actorRole: "CONG_DAN",
        action: "DANH_GIA_SIPAS",
        entityType: "DOSSIER",
        entityCode: dossier.dossierCode,
        detail: `Công dân đánh giá mức độ hài lòng: ${parsed.data.rating}.`,
        ipAddress: getClientIp(req),
      },
    });

    return NextResponse.json({ ok: true, satisfactionRating: updated.satisfactionRating });
  } catch (error) {
    console.error("[TRACK_RATE_ERROR]", error);
    return NextResponse.json({ error: "Lỗi khi ghi nhận đánh giá hài lòng" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = publicPinActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Yêu cầu thao tác trực tuyến không hợp lệ." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const code = input.dossierCode.toUpperCase();
    const dossier = await prisma.dossier.findUnique({
      where: { dossierCode: code },
      include: { procedure: true },
    });

    if (!dossier) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ hành chính." }, { status: 404 });
    }
    if (dossier.trackingPin !== input.trackingPin) {
      return NextResponse.json(
        { error: "Mã PIN xác thực không chính xác, không thể thực hiện thao tác." },
        { status: 403 }
      );
    }

    const clientIp = getClientIp(req);
    const now = new Date();
    const holidays = await prisma.holiday.findMany({ select: { dateStr: true } });
    const holidayDates = holidays.map((h) => h.dateStr);

    if (input.action === "THU_LE_PHI") {
      if (dossier.feeExempt || dossier.feeAmount <= 0 || dossier.feeStatus === "DA_THU_PHI") {
        return NextResponse.json(
          { error: "Hồ sơ này không còn nghĩa vụ lệ phí cần thanh toán." },
          { status: 422 }
        );
      }
      if (!["DA_TIEP_NHAN", "DANG_THAM_DINH", "CHO_PHE_DUYET", "CHO_TRA_KET_QUA"].includes(dossier.status)) {
        return NextResponse.json(
          { error: "Chỉ thanh toán lệ phí sau khi hồ sơ đã được tiếp nhận." },
          { status: 422 }
        );
      }

      const detail = await prisma.$transaction(async (tx) => {
        const year = now.getFullYear();
        let receiptSeq = await nextSequence(tx, `RECEIPT_${year}`, 48);
        let receiptNumber = `BL-${year}-${String(receiptSeq).padStart(4, "0")}`;
        while (await tx.dossier.findUnique({ where: { receiptNumber } })) {
          receiptSeq = await nextSequence(tx, `RECEIPT_${year}`, receiptSeq);
          receiptNumber = `BL-${year}-${String(receiptSeq).padStart(4, "0")}`;
        }
        const txDetail = `Công dân nộp lệ phí trực tuyến ${dossier.feeAmount.toLocaleString("vi-VN")} đồng qua Cổng Tra cứu (PIN). Xuất Biên lai số ${receiptNumber}.`;

        await tx.dossier.update({
          where: { id: dossier.id },
          data: {
            feeStatus: "DA_THU_PHI",
            paymentMethod: "TRUC_TUYEN",
            receiptNumber,
            paidAt: now,
          },
        });
        await tx.dossierHistory.create({
          data: {
            dossierId: dossier.id,
            fromStatus: dossier.status,
            toStatus: dossier.status,
            actionName: "Thanh toán lệ phí trực tuyến",
            actorName: dossier.applicantName,
            actorRole: "CONG_DAN",
            note: txDetail,
          },
        });
        await tx.auditLog.create({
          data: {
            actorName: dossier.applicantName,
            actorRole: "CONG_DAN",
            action: "THU_LE_PHI",
            entityType: "DOSSIER",
            entityCode: dossier.dossierCode,
            detail: txDetail,
            ipAddress: clientIp,
          },
        });

        return txDetail;
      });

      return NextResponse.json({ ok: true, message: detail });
    }

    if (input.action === "BO_SUNG_HO_SO") {
      if (dossier.status !== "YEU_CAU_BO_SUNG") {
        return NextResponse.json(
          { error: "Hồ sơ hiện không ở trạng thái chờ bổ sung (Mẫu 02)." },
          { status: 422 }
        );
      }
      const addedPausedMinutes =
        dossier.dueAt && dossier.slaPausedAt
          ? calculateWorkingMinutesBetween(new Date(dossier.slaPausedAt), now, holidayDates)
          : 0;
      const compensatedDue = dossier.dueAt
        ? compensatePausedDuration(dossier.dueAt, addedPausedMinutes, holidayDates)
        : calculateDueDate(
            now,
            dossier.procedure.processingDays,
            dossier.procedure.processingHours,
            holidayDates
          );
      const nextStatus = dossier.assigneeId ? "DANG_THAM_DINH" : "DA_TIEP_NHAN";
      const fileName = input.newAttachmentName?.trim() || "TaiLieu_BoSung_TrucTuyen.pdf";
      const detail =
        input.note ||
        `Công dân nộp bổ sung tệp "${fileName}" qua Cổng Tra cứu (cộng bù ${addedPausedMinutes} phút chờ bổ sung).`;

      await prisma.$transaction(async (tx) => {
        const resumeAssigneeId =
          dossier.assigneeId ?? (await pickLeastLoadedSpecialist(tx, dossier.departmentId));

        await tx.dossierAttachment.create({
          data: {
            dossierId: dossier.id,
            docCode: "BS-PIN",
            docName: "Tài liệu công dân nộp bổ sung trực tuyến theo Mẫu 02",
            isMandatory: true,
            submittedType: "BAN_DIEN_TU",
            quantity: 1,
            fileName,
            isVerified: false,
          },
        });
        await tx.dossier.update({
          where: { id: dossier.id },
          data: {
            status: nextStatus,
            assigneeId: resumeAssigneeId,
            slaPausedAt: null,
            totalPausedMinutes: dossier.totalPausedMinutes + addedPausedMinutes,
            dueAt: compensatedDue,
            acceptedAt: dossier.acceptedAt ?? now,
          },
        });
        await tx.dossierHistory.create({
          data: {
            dossierId: dossier.id,
            fromStatus: dossier.status,
            toStatus: nextStatus,
            actionName: "Công dân nộp bổ sung hồ sơ trực tuyến",
            actorName: dossier.applicantName,
            actorRole: "CONG_DAN",
            note: detail,
          },
        });
        await tx.auditLog.create({
          data: {
            actorName: dossier.applicantName,
            actorRole: "CONG_DAN",
            action: "BO_SUNG_HO_SO",
            entityType: "DOSSIER",
            entityCode: dossier.dossierCode,
            detail,
            ipAddress: clientIp,
          },
        });
      });

      return NextResponse.json({ ok: true, message: detail });
    }

    if (input.action === "RUT_HO_SO") {
      if (!["MOI_NOP", "DA_TIEP_NHAN", "YEU_CAU_BO_SUNG", "DANG_THAM_DINH"].includes(dossier.status)) {
        return NextResponse.json(
          { error: "Không thể rút hồ sơ khi cơ quan đã trình/ký duyệt kết quả giải quyết." },
          { status: 422 }
        );
      }
      const detail = input.note || "Công dân xác thực Mã PIN và đề nghị rút hồ sơ trực tuyến.";

      await prisma.$transaction([
        prisma.dossier.update({
          where: { id: dossier.id },
          data: {
            status: "DA_RUT_HO_SO",
            slaPausedAt: null,
            feeStatus: dossier.feeStatus === "DA_THU_PHI" ? "HOAN_PHI" : dossier.feeStatus,
          },
        }),
        prisma.dossierHistory.create({
          data: {
            dossierId: dossier.id,
            fromStatus: dossier.status,
            toStatus: "DA_RUT_HO_SO",
            actionName: "Công dân rút hồ sơ trực tuyến",
            actorName: dossier.applicantName,
            actorRole: "CONG_DAN",
            note: detail,
          },
        }),
        prisma.auditLog.create({
          data: {
            actorName: dossier.applicantName,
            actorRole: "CONG_DAN",
            action: "RUT_HO_SO",
            entityType: "DOSSIER",
            entityCode: dossier.dossierCode,
            detail,
            ipAddress: clientIp,
          },
        }),
      ]);

      return NextResponse.json({ ok: true, message: detail });
    }

    return NextResponse.json({ error: "Thao tác không hỗ trợ." }, { status: 400 });
  } catch (error) {
    console.error("[TRACK_ACTION_ERROR]", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi thực hiện thao tác trực tuyến" }, { status: 500 });
  }
}
