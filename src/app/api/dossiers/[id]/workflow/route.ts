import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSession, getClientIp } from "@/lib/auth";
import { workflowActionSchema } from "@/lib/validations";
import { validateWorkflowTransition, WORKFLOW_RULES } from "@/lib/workflow-engine";
import {
  addWorkingDays,
  calculateDueDate,
  calculateWorkingMinutesBetween,
  compensatePausedDuration,
} from "@/lib/sla-engine";
import { pickLeastLoadedSpecialist } from "@/lib/specialist-assignment";
import { nextSequence } from "@/lib/sequence";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Phiên làm việc đã hết hạn, vui lòng đăng nhập lại." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = workflowActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Tham số xử lý nghiệp vụ không hợp lệ" },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const dossier = await prisma.dossier.findFirst({
      where: { OR: [{ id }, { dossierCode: id }] },
      include: {
        procedure: true,
        department: true,
        attachments: true,
      },
    });

    if (!dossier) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ cần xử lý." }, { status: 404 });
    }

    // Kiểm soát thẩm quyền theo Phòng ban chuyên môn đối với Chuyên viên
    if (
      session.role === "CHUYEN_VIEN" &&
      session.departmentId &&
      session.departmentId !== dossier.departmentId
    ) {
      return NextResponse.json(
        {
          error: `Chuyên viên thuộc [${session.departmentName}] không được phép xử lý hồ sơ thuộc thẩm quyền [${dossier.department.name}].`,
        },
        { status: 403 }
      );
    }

    const verifiedSet = new Set(input.verifiedAttachmentIds || []);
    const mandatoryUnverifiedCount = dossier.attachments.filter((att) => {
      if (!att.isMandatory) return false;
      if (att.isVerified || verifiedSet.has(att.id)) return false;
      return true;
    }).length;

    const validation = validateWorkflowTransition({
      action: input.action,
      actorRole: session.role,
      actorId: session.userId,
      currentStatus: dossier.status,
      applicantId: dossier.applicantId,
      feeAmount: dossier.feeAmount,
      feeExempt: dossier.feeExempt,
      feeStatus: dossier.feeStatus,
      supplementCount: dossier.supplementCount,
      extendedCount: dossier.extendedCount,
      mandatoryUnverifiedCount,
      payload: {
        note: input.note,
        assigneeId: input.assigneeId,
        supplementReason: input.supplementReason,
        rejectionReason: input.rejectionReason,
        rejectionLegalBasis: input.rejectionLegalBasis,
        appraisalNote: input.appraisalNote,
        resultDocNumber: input.resultDocNumber,
        resultSummary: input.resultSummary,
        apologyReason: input.apologyReason,
        extraWorkingDays: input.extraWorkingDays,
      },
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const holidays = await prisma.holiday.findMany({ select: { dateStr: true } });
    const holidayDates = holidays.map((h) => h.dateStr);
    const now = new Date();
    const rule = WORKFLOW_RULES[input.action];

    const updated = await prisma.$transaction(async (tx) => {
      // Cập nhật xác thực thành phần hồ sơ nếu cán bộ tích đối chiếu
      if (input.verifiedAttachmentIds && input.verifiedAttachmentIds.length > 0) {
        await tx.dossierAttachment.updateMany({
          where: {
            dossierId: dossier.id,
            id: { in: input.verifiedAttachmentIds },
          },
          data: { isVerified: true },
        });
      }

      const dataToUpdate: Record<string, unknown> = {
        status: validation.nextStatus,
      };
      let historyNote = input.note || rule.description;

      if (input.action === "TIEP_NHAN") {
        const dueAt = calculateDueDate(
          now,
          dossier.procedure.processingDays,
          dossier.procedure.processingHours,
          holidayDates
        );

        let targetAssigneeId = input.assigneeId || dossier.assigneeId;
        if (!targetAssigneeId) {
          targetAssigneeId = await pickLeastLoadedSpecialist(tx, dossier.departmentId);
        }

        // Khi Một cửa tiếp nhận hợp lệ, đánh dấu thành phần đã qua kiểm tra sơ bộ
        await tx.dossierAttachment.updateMany({
          where: { dossierId: dossier.id },
          data: { isVerified: true },
        });

        dataToUpdate.acceptedAt = now;
        dataToUpdate.dueAt = dueAt;
        dataToUpdate.receiverId = session.userId;
        dataToUpdate.assigneeId = targetAssigneeId;
        historyNote =
          input.note ||
          `Tiếp nhận hợp lệ, cấp Giấy tiếp nhận và hẹn trả kết quả (Mẫu 01). Hạn trả: ${dueAt.toLocaleString("vi-VN")}.`;
      }

      if (input.action === "YEU_CAU_BO_SUNG") {
        const supplementDeadline = addWorkingDays(now, 5, holidayDates);
        dataToUpdate.slaPausedAt = now;
        dataToUpdate.supplementCount = dossier.supplementCount + 1;
        dataToUpdate.supplementReason = input.supplementReason;
        dataToUpdate.supplementDeadline = supplementDeadline;
        historyNote = `Ban hành Phiếu yêu cầu bổ sung lần 01 (Mẫu 02): ${input.supplementReason}`;
      }

      if (input.action === "BO_SUNG_HO_SO") {
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

        // Nếu hồ sơ đã được phân công Chuyên viên thẩm định trước đó -> quay lại DANG_THAM_DINH
        // Nếu tạm dừng từ bước tiếp nhận sơ bộ -> gán chuyên viên ít việc nhất và chuyển sang DA_TIEP_NHAN
        let resumeAssigneeId = dossier.assigneeId;
        if (!resumeAssigneeId) {
          resumeAssigneeId = await pickLeastLoadedSpecialist(tx, dossier.departmentId);
        }
        const resumedStatus = dossier.assigneeId ? "DANG_THAM_DINH" : "DA_TIEP_NHAN";
        dataToUpdate.status = resumedStatus;
        dataToUpdate.assigneeId = resumeAssigneeId;
        if (!dossier.receiverId && session.role !== "CONG_DAN") {
          dataToUpdate.receiverId = session.userId;
        }

        dataToUpdate.slaPausedAt = null;
        dataToUpdate.totalPausedMinutes = dossier.totalPausedMinutes + addedPausedMinutes;
        dataToUpdate.dueAt = compensatedDue;
        if (!dossier.acceptedAt) {
          dataToUpdate.acceptedAt = now;
        }

        if (input.newAttachmentName && input.newAttachmentName.trim().length > 0) {
          await tx.dossierAttachment.create({
            data: {
              dossierId: dossier.id,
              docCode: "BS-BOSUNG",
              docName: "Tài liệu nộp bổ sung theo Phiếu hướng dẫn Mẫu 02",
              isMandatory: true,
              submittedType: "BAN_DIEN_TU",
              quantity: 1,
              fileName: input.newAttachmentName.trim(),
              isVerified: session.role !== "CONG_DAN",
            },
          });
        }

        historyNote =
          input.note ||
          `Đã cập nhật hồ sơ bổ sung. Kích hoạt lại đồng hồ SLA (cộng bù ${addedPausedMinutes} phút chờ bổ sung).`;
      }

      if (input.action === "TU_CHOI_TIEP_NHAN") {
        dataToUpdate.rejectionReason = input.rejectionReason;
        dataToUpdate.rejectionLegalBasis = input.rejectionLegalBasis;
        dataToUpdate.slaPausedAt = null;
        if (dossier.feeStatus === "DA_THU_PHI") {
          dataToUpdate.feeStatus = "HOAN_PHI";
        }
        historyNote = `Từ chối tiếp nhận (Mẫu 03): ${input.rejectionReason} (Căn cứ: ${input.rejectionLegalBasis})`;
      }

      if (input.action === "NHAN_THAM_DINH") {
        dataToUpdate.assigneeId = session.role === "CHUYEN_VIEN" ? session.userId : dossier.assigneeId;
        historyNote = input.note || "Chuyên viên tiếp nhận hồ sơ và bắt đầu thẩm định chuyên môn.";
      }

      if (input.action === "CHUYEN_CHUYEN_VIEN") {
        const targetSpecialist = await tx.user.findFirst({
          where: {
            id: input.assigneeId,
            role: "CHUYEN_VIEN",
            departmentId: dossier.departmentId,
            isActive: true,
          },
        });
        if (!targetSpecialist) {
          throw new Error("INVALID_SPECIALIST_DEPT");
        }
        dataToUpdate.assigneeId = targetSpecialist.id;
        historyNote =
          input.note ||
          `Điều chuyển phân công thụ lý sang chuyên viên ${targetSpecialist.fullName} (${dossier.department.name}).`;
      }

      if (input.action === "TRINH_PHE_DUYET") {
        dataToUpdate.appraisalNote = input.appraisalNote;
        if (session.role === "CHUYEN_VIEN") {
          dataToUpdate.assigneeId = session.userId;
        }
        historyNote = `Hoàn tất thẩm định & trình Lãnh đạo phê duyệt: ${input.appraisalNote}`;
      }

      if (input.action === "PHE_DUYET_KET_QUA") {
        const cleanDocSymbol = input.resultDocNumber!.trim().toUpperCase();
        const year = now.getFullYear();
        const eresSeq = await nextSequence(tx, `ERESULT_${year}`, 405);
        dataToUpdate.approverId = session.userId;
        dataToUpdate.leaderNote = input.leaderNote || "Đồng ý phê duyệt kết quả giải quyết TTHC.";
        dataToUpdate.resultDocNumber = cleanDocSymbol;
        dataToUpdate.resultSummary = input.resultSummary!.trim();
        dataToUpdate.isDigitizedResult = true;
        dataToUpdate.electronicResultCode = `KQDT-${year}-${String(eresSeq).padStart(4, "0")}`;
        dataToUpdate.signedAt = now;

        // Liên thông tự động vào Sổ Văn bản đi của cơ quan nếu chưa có số ký hiệu này
        const existingDoc = await tx.officialDocument.findUnique({
          where: { documentSymbol: cleanDocSymbol },
        });
        if (!existingDoc) {
          const nextOutgoingNum = await nextSequence(tx, `DOC_DI_${year}`, 103);
          await tx.officialDocument.create({
            data: {
              direction: "DI",
              outgoingNumber: nextOutgoingNum,
              documentSymbol: cleanDocSymbol,
              docType: "GIAY_XAC_NHAN",
              urgency: "THUONG",
              security: "THUONG",
              status: "DA_BAN_HANH",
              title: input.resultSummary!.trim(),
              contentSummary: `Văn bản kết quả giải quyết hồ sơ Một cửa mã ${dossier.dossierCode} cho ông/bà ${dossier.applicantName}.`,
              issuingAgency: "UBND Phường Thanh Nhàn",
              recipientAgency: dossier.applicantName,
              signerName: session.fullName,
              signerTitle: session.positionTitle || "Lãnh đạo UBND",
              issuedDate: now,
              leadDepartmentId: dossier.departmentId,
              assigneeId: dossier.assigneeId,
              linkedDossierId: dossier.id,
              createdById: session.userId,
            },
          });
        }

        historyNote = `Lãnh đạo ký duyệt ban hành kết quả số [${cleanDocSymbol}]: ${input.resultSummary}`;
      }

      if (input.action === "TRA_LAI_THAM_DINH") {
        dataToUpdate.leaderNote = input.leaderNote || input.note || "Yêu cầu rà soát, thẩm định lại hồ sơ.";
        historyNote = `Lãnh đạo trả lại thẩm định bổ sung: ${dataToUpdate.leaderNote}`;
      }

      if (input.action === "THU_LE_PHI") {
        const year = now.getFullYear();
        let receiptSeq = await nextSequence(tx, `RECEIPT_${year}`, 48);
        let receiptNumber = `BL-${year}-${String(receiptSeq).padStart(4, "0")}`;
        while (await tx.dossier.findUnique({ where: { receiptNumber } })) {
          receiptSeq = await nextSequence(tx, `RECEIPT_${year}`, receiptSeq);
          receiptNumber = `BL-${year}-${String(receiptSeq).padStart(4, "0")}`;
        }
        const paymentMethod = session.role === "CONG_DAN" ? "TRUC_TUYEN" : "TIEN_MAT";
        dataToUpdate.feeStatus = "DA_THU_PHI";
        dataToUpdate.paymentMethod = paymentMethod;
        dataToUpdate.receiptNumber = receiptNumber;
        dataToUpdate.paidAt = now;
        historyNote = `Đã thu lệ phí ${dossier.feeAmount.toLocaleString("vi-VN")} đồng (${
          paymentMethod === "TRUC_TUYEN" ? "Trực tuyến" : "Tại quầy Một cửa"
        }). Xuất Biên lai điện tử số ${receiptNumber}.`;
      }

      if (input.action === "GIA_HAN_XIN_LOI") {
        const extraDays = input.extraWorkingDays ?? 3;
        const baseDue = dossier.dueAt ?? now;
        const newDue = addWorkingDays(new Date(baseDue), extraDays, holidayDates);
        const year = now.getFullYear();
        const apologySeq = await nextSequence(tx, `APOLOGY_${year}`, 1);
        const apologyCode = `PXL-${year}-${String(apologySeq).padStart(4, "0")}`;
        dataToUpdate.extendedCount = dossier.extendedCount + 1;
        dataToUpdate.dueAt = newDue;
        dataToUpdate.apologyFormCode = apologyCode;
        dataToUpdate.apologyReason = input.apologyReason;
        historyNote = `Gia hạn lần 1 thêm ${extraDays} ngày làm việc (hạn mới: ${newDue.toLocaleDateString(
          "vi-VN"
        )}). Đã lập Phiếu xin lỗi số ${apologyCode}. Lý do: ${input.apologyReason}`;
      }

      if (input.action === "TRA_KET_QUA") {
        dataToUpdate.completedAt = now;
        historyNote =
          input.note ||
          `Đã bàn giao kết quả giải quyết [${dossier.resultDocNumber || "Bản chính"}] cho công dân và hoàn tất hồ sơ.`;
      }

      if (input.action === "RUT_HO_SO") {
        dataToUpdate.slaPausedAt = null;
        if (dossier.feeStatus === "DA_THU_PHI") {
          dataToUpdate.feeStatus = "HOAN_PHI";
        }
        historyNote = input.note || "Người yêu cầu đề nghị rút hồ sơ trước khi ban hành kết quả.";
      }

      const nextDossier = await tx.dossier.update({
        where: { id: dossier.id },
        data: dataToUpdate,
      });

      await tx.dossierHistory.create({
        data: {
          dossierId: dossier.id,
          fromStatus: dossier.status,
          toStatus: nextDossier.status,
          actionName: rule.label,
          actorId: session.userId,
          actorName: session.fullName,
          actorRole: session.role,
          note: historyNote,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          actorName: session.fullName,
          actorRole: session.role,
          action: input.action,
          entityType: "DOSSIER",
          entityCode: dossier.dossierCode,
          detail: historyNote,
          ipAddress: getClientIp(req),
        },
      });

      return nextDossier;
    });

    return NextResponse.json({ ok: true, dossier: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_SPECIALIST_DEPT") {
      return NextResponse.json(
        { error: "Chuyên viên được chọn không thuộc phòng ban chuyên môn chủ trì hồ sơ hoặc đã ngưng hoạt động." },
        { status: 422 }
      );
    }
    console.error("[WORKFLOW_ERROR]", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi thực thi quy trình nghiệp vụ" }, { status: 500 });
  }
}
