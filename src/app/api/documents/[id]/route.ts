import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSession, isStaffRole, getClientIp } from "@/lib/auth";
import { updateDocumentActionSchema } from "@/lib/validations";
import { nextSequence } from "@/lib/sequence";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getCurrentSession();
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "Không có quyền điều hành văn bản." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateDocumentActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu cập nhật văn bản không hợp lệ" },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const doc = await prisma.officialDocument.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: "Không tìm thấy văn bản." }, { status: 404 });
    }

    // Kiểm soát ABAC bảo mật đối với văn bản MẬT / TỐI MẬT (NĐ 30/2020/NĐ-CP)
    if (
      doc.security !== "THUONG" &&
      session.role !== "LANH_DAO" &&
      session.role !== "QUAN_TRI" &&
      doc.createdById !== session.userId &&
      doc.assigneeId !== session.userId
    ) {
      return NextResponse.json(
        { error: "Văn bản thuộc chế độ Mật/Tối mật — tài khoản hiện tại không được phân quyền truy cập." },
        { status: 403 }
      );
    }

    if (input.action === "BUT_PHE_PHAN_CONG") {
      if (doc.direction !== "DEN") {
        return NextResponse.json(
          { error: "Thao tác Bút phê phân công chỉ áp dụng cho Văn bản đến." },
          { status: 422 }
        );
      }
      if (doc.status === "LUU_TRU") {
        return NextResponse.json(
          { error: "Văn bản đã đóng hồ sơ lưu trữ, không thể bút phê phân công lại." },
          { status: 422 }
        );
      }
      if (session.role !== "LANH_DAO" && session.role !== "QUAN_TRI") {
        return NextResponse.json(
          { error: "Chỉ Lãnh đạo đơn vị hoặc Chánh Văn phòng mới có thẩm quyền bút phê phân công văn bản đến." },
          { status: 403 }
        );
      }
      if (!input.directiveNote || input.directiveNote.length < 5) {
        return NextResponse.json(
          { error: "Vui lòng nhập nội dung bút phê chỉ đạo xử lý (tối thiểu 5 ký tự)." },
          { status: 422 }
        );
      }
    }

    if (input.action === "TRA_LAI_DU_THAO") {
      if (doc.direction !== "DI" || doc.status !== "CHO_KY_BAN_HANH") {
        return NextResponse.json(
          { error: "Chỉ có thể trả lại chỉnh sửa đối với Dự thảo văn bản đi đang chờ ký ban hành." },
          { status: 422 }
        );
      }
      if (session.role !== "LANH_DAO" && session.role !== "QUAN_TRI") {
        return NextResponse.json(
          { error: "Chỉ Lãnh đạo hoặc Quản trị Văn thư mới có thẩm quyền trả lại dự thảo văn bản đi." },
          { status: 403 }
        );
      }
      if (!input.directiveNote || input.directiveNote.length < 5) {
        return NextResponse.json(
          { error: "Vui lòng ghi rõ ý kiến chỉ đạo chỉnh sửa dự thảo (tối thiểu 5 ký tự)." },
          { status: 422 }
        );
      }
    }

    if (input.action === "CAP_NHAT_XU_LY") {
      if (doc.status === "DA_BAN_HANH" || doc.status === "LUU_TRU") {
        return NextResponse.json(
          { error: "Văn bản đã ban hành hoặc đã lưu trữ, không thể cập nhật xử lý." },
          { status: 422 }
        );
      }
      if (
        session.role === "CHUYEN_VIEN" &&
        doc.leadDepartmentId &&
        session.departmentId &&
        doc.leadDepartmentId !== session.departmentId &&
        doc.assigneeId !== session.userId &&
        doc.createdById !== session.userId
      ) {
        return NextResponse.json(
          { error: "Chuyên viên không thuộc đơn vị chủ trì được giao xử lý văn bản này." },
          { status: 403 }
        );
      }
      if (doc.direction === "DEN" && doc.status === "CHO_BUT_PHE" && session.role !== "LANH_DAO" && session.role !== "QUAN_TRI") {
        return NextResponse.json(
          { error: "Văn bản đến đang chờ Lãnh đạo bút phê phân công, chưa thể đóng hồ sơ xử lý." },
          { status: 422 }
        );
      }
      if (!input.resolutionNote || input.resolutionNote.length < 5) {
        return NextResponse.json(
          { error: "Vui lòng nhập báo cáo kết quả thực hiện / hoàn thiện dự thảo (tối thiểu 5 ký tự)." },
          { status: 422 }
        );
      }
    }

    if (input.action === "KY_BAN_HANH") {
      if (doc.direction !== "DI") {
        return NextResponse.json(
          { error: "Thao tác Ký số & Đóng dấu ban hành chỉ áp dụng cho Văn bản đi." },
          { status: 422 }
        );
      }
      if (doc.status !== "CHO_KY_BAN_HANH") {
        return NextResponse.json(
          { error: "Chỉ ký ban hành đối với Dự thảo văn bản đi đang ở trạng thái Chờ ký số." },
          { status: 422 }
        );
      }
      if (session.role !== "LANH_DAO" && session.role !== "QUAN_TRI") {
        return NextResponse.json(
          { error: "Chỉ Lãnh đạo UBND hoặc Quản trị Văn thư mới được ký số và đóng dấu ban hành văn bản đi." },
          { status: 403 }
        );
      }
    }

    if (input.action === "LUU_TRU") {
      if (doc.status === "LUU_TRU") {
        return NextResponse.json(
          { error: "Văn bản đã nằm trong hồ sơ Lưu trữ cơ quan." },
          { status: 422 }
        );
      }
      if (
        session.role === "CHUYEN_VIEN" &&
        doc.leadDepartmentId &&
        session.departmentId &&
        doc.leadDepartmentId !== session.departmentId
      ) {
        return NextResponse.json(
          { error: "Chuyên viên không có thẩm quyền lưu trữ văn bản của phòng ban khác." },
          { status: 403 }
        );
      }
      if (doc.status === "CHO_BUT_PHE" && session.role !== "LANH_DAO" && session.role !== "QUAN_TRI") {
        return NextResponse.json(
          { error: "Văn bản chưa được Lãnh đạo bút phê chỉ đạo, không thể chuyển thẳng vào Lưu trữ." },
          { status: 422 }
        );
      }
      if (doc.direction === "DI" && doc.status !== "DA_BAN_HANH" && session.role !== "LANH_DAO" && session.role !== "QUAN_TRI") {
        return NextResponse.json(
          { error: "Dự thảo văn bản đi chưa ký ban hành không thể tự ý lưu trữ bởi chuyên viên." },
          { status: 422 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      let auditDetail = "";

      if (input.action === "BUT_PHE_PHAN_CONG") {
        updateData.directiveNote = input.directiveNote;
        updateData.leadDepartmentId = input.leadDepartmentId || doc.leadDepartmentId;
        updateData.assigneeId = input.assigneeId || doc.assigneeId;
        updateData.status = "DANG_XU_LY";
        auditDetail = `Bút phê chỉ đạo văn bản ${doc.documentSymbol}: ${input.directiveNote}`;
      } else if (input.action === "TRA_LAI_DU_THAO") {
        updateData.directiveNote = input.directiveNote;
        updateData.status = "DANG_XU_LY";
        auditDetail = `Trả lại dự thảo văn bản đi ${doc.documentSymbol} để chỉnh sửa: ${input.directiveNote}`;
      } else if (input.action === "CAP_NHAT_XU_LY") {
        updateData.resolutionNote = input.resolutionNote;
        // Nếu là dự thảo VB đi đang hoàn thiện lại -> trình lại CHO_KY_BAN_HANH; nếu là VB đến -> hoàn tất LUU_TRU
        updateData.status = doc.direction === "DI" ? "CHO_KY_BAN_HANH" : "LUU_TRU";
        auditDetail =
          doc.direction === "DI"
            ? `Hoàn thiện dự thảo và trình ký lại văn bản đi ${doc.documentSymbol}: ${input.resolutionNote}`
            : `Hoàn tất xử lý và lưu hồ sơ văn bản đến ${doc.documentSymbol}: ${input.resolutionNote}`;
      } else if (input.action === "KY_BAN_HANH") {
        const now = new Date();
        const year = now.getFullYear();
        const assignedOutgoing =
          doc.outgoingNumber ?? (await nextSequence(tx, `DOC_DI_${year}`, 103));
        updateData.status = "DA_BAN_HANH";
        updateData.outgoingNumber = assignedOutgoing;
        updateData.signerName = input.signerName || session.fullName;
        updateData.signerTitle = input.signerTitle || session.positionTitle || "Chủ tịch UBND";
        updateData.issuedDate = now;
        auditDetail = `Ký duyệt và đóng dấu ban hành văn bản đi số ${doc.documentSymbol} (Số đi #${assignedOutgoing}).`;
      } else if (input.action === "LUU_TRU") {
        updateData.status = "LUU_TRU";
        auditDetail = `Đưa văn bản ${doc.documentSymbol} vào lưu trữ hồ sơ công việc.`;
      }

      const nextDoc = await tx.officialDocument.update({
        where: { id },
        data: updateData,
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
          action: input.action,
          entityType: "DOCUMENT",
          entityCode: doc.documentSymbol,
          detail: auditDetail,
          ipAddress: getClientIp(req),
        },
      });

      return nextDoc;
    });

    return NextResponse.json({ ok: true, document: updated });
  } catch (error) {
    console.error("[UPDATE_DOCUMENT_ERROR]", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi cập nhật văn bản" }, { status: 500 });
  }
}
