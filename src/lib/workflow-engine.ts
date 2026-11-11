import { DossierStatus, FeeStatus, Role } from "@prisma/client";

/**
 * Máy Trạng Thái Nghiệp Vụ Hành Chính Một Cửa Liên Thông (Workflow Engine)
 * Căn cứ quy trình chuẩn Nghị định 61/2018/NĐ-CP & Nghị định 107/2021/NĐ-CP:
 * Kiểm soát chặt quyền hạn theo Vai trò, trạng thái gốc -> trạng thái đích, và điều kiện bắt buộc đi kèm.
 */

export type WorkflowActionCode =
  | "TIEP_NHAN"
  | "YEU_CAU_BO_SUNG"
  | "TU_CHOI_TIEP_NHAN"
  | "BO_SUNG_HO_SO"
  | "NHAN_THAM_DINH"
  | "CHUYEN_CHUYEN_VIEN"
  | "TRINH_PHE_DUYET"
  | "PHE_DUYET_KET_QUA"
  | "TRA_LAI_THAM_DINH"
  | "THU_LE_PHI"
  | "GIA_HAN_XIN_LOI"
  | "TRA_KET_QUA"
  | "RUT_HO_SO";

export interface WorkflowRuleDefinition {
  code: WorkflowActionCode;
  label: string;
  allowedRoles: Role[];
  allowedFromStatuses: DossierStatus[];
  targetStatus: DossierStatus | "KEEP";
  description: string;
}

export const WORKFLOW_RULES: Record<WorkflowActionCode, WorkflowRuleDefinition> = {
  TIEP_NHAN: {
    code: "TIEP_NHAN",
    label: "Tiếp nhận & Cấp giấy hẹn (Mẫu 01)",
    allowedRoles: ["MOT_CUA", "QUAN_TRI"],
    allowedFromStatuses: ["MOI_NOP"],
    targetStatus: "DA_TIEP_NHAN",
    description: "Kiểm tra tính đầy đủ hợp lệ, tiếp nhận chính thức và tính ngày hẹn trả kết quả.",
  },
  YEU_CAU_BO_SUNG: {
    code: "YEU_CAU_BO_SUNG",
    label: "Yêu cầu bổ sung hồ sơ (Mẫu 02)",
    allowedRoles: ["MOT_CUA", "CHUYEN_VIEN", "QUAN_TRI"],
    allowedFromStatuses: ["MOI_NOP", "DA_TIEP_NHAN", "DANG_THAM_DINH"],
    targetStatus: "YEU_CAU_BO_SUNG",
    description: "Ban hành Phiếu yêu cầu bổ sung, hoàn thiện hồ sơ và tạm dừng đồng hồ SLA.",
  },
  TU_CHOI_TIEP_NHAN: {
    code: "TU_CHOI_TIEP_NHAN",
    label: "Từ chối tiếp nhận (Mẫu 03)",
    allowedRoles: ["MOT_CUA", "LANH_DAO", "QUAN_TRI"],
    allowedFromStatuses: ["MOI_NOP", "DA_TIEP_NHAN", "DANG_THAM_DINH"],
    targetStatus: "TU_CHOI_TIEP_NHAN",
    description: "Từ chối giải quyết do không thuộc thẩm quyền hoặc không đủ điều kiện theo luật định.",
  },
  BO_SUNG_HO_SO: {
    code: "BO_SUNG_HO_SO",
    label: "Nộp bổ sung thành phần hồ sơ",
    allowedRoles: ["CONG_DAN", "MOT_CUA", "QUAN_TRI"],
    allowedFromStatuses: ["YEU_CAU_BO_SUNG"],
    targetStatus: "DA_TIEP_NHAN",
    description: "Công dân hoặc Bộ phận Một cửa cập nhật tài liệu bổ sung, kích hoạt lại đồng hồ SLA.",
  },
  NHAN_THAM_DINH: {
    code: "NHAN_THAM_DINH",
    label: "Thụ lý & Thẩm định chuyên môn",
    allowedRoles: ["CHUYEN_VIEN", "QUAN_TRI"],
    allowedFromStatuses: ["DA_TIEP_NHAN"],
    targetStatus: "DANG_THAM_DINH",
    description: "Chuyên viên phòng chuyên môn tiếp nhận hồ sơ để kiểm tra thực địa / thẩm định pháp lý.",
  },
  CHUYEN_CHUYEN_VIEN: {
    code: "CHUYEN_CHUYEN_VIEN",
    label: "Điều chuyển / Phân công lại Chuyên viên",
    allowedRoles: ["MOT_CUA", "LANH_DAO", "QUAN_TRI"],
    allowedFromStatuses: ["DA_TIEP_NHAN", "DANG_THAM_DINH"],
    targetStatus: "KEEP",
    description: "Điều phối lại chuyên viên thụ lý trong cùng bộ phận chuyên môn khi quá tải hoặc vắng mặt.",
  },
  TRINH_PHE_DUYET: {
    code: "TRINH_PHE_DUYET",
    label: "Hoàn tất thẩm định & Trình Lãnh đạo ký",
    allowedRoles: ["CHUYEN_VIEN", "QUAN_TRI"],
    allowedFromStatuses: ["DANG_THAM_DINH"],
    targetStatus: "CHO_PHE_DUYET",
    description: "Đính kèm dự thảo kết quả giải quyết và tờ trình trình Lãnh đạo phê duyệt.",
  },
  PHE_DUYET_KET_QUA: {
    code: "PHE_DUYET_KET_QUA",
    label: "Ký duyệt & Ban hành kết quả",
    allowedRoles: ["LANH_DAO", "QUAN_TRI"],
    allowedFromStatuses: ["CHO_PHE_DUYET"],
    targetStatus: "CHO_TRA_KET_QUA",
    description: "Lãnh đạo phê duyệt, cấp số hiệu kết quả giải quyết và chuyển Một cửa trả kết quả.",
  },
  TRA_LAI_THAM_DINH: {
    code: "TRA_LAI_THAM_DINH",
    label: "Yêu cầu thẩm định lại",
    allowedRoles: ["LANH_DAO", "QUAN_TRI"],
    allowedFromStatuses: ["CHO_PHE_DUYET"],
    targetStatus: "DANG_THAM_DINH",
    description: "Chuyển trả hồ sơ về chuyên viên thụ lý để rà soát lại nội dung chuyên môn.",
  },
  THU_LE_PHI: {
    code: "THU_LE_PHI",
    label: "Thu lệ phí & Xuất biên lai điện tử",
    allowedRoles: ["CONG_DAN", "MOT_CUA", "QUAN_TRI"],
    allowedFromStatuses: [
      "DA_TIEP_NHAN",
      "DANG_THAM_DINH",
      "CHO_PHE_DUYET",
      "CHO_TRA_KET_QUA",
    ],
    targetStatus: "KEEP",
    description: "Ghi nhận nộp lệ phí hành chính và cấp số Biên lai thu tiền điện tử.",
  },
  GIA_HAN_XIN_LOI: {
    code: "GIA_HAN_XIN_LOI",
    label: "Gia hạn & Lập Phiếu xin lỗi (Mẫu 04)",
    allowedRoles: ["CHUYEN_VIEN", "LANH_DAO", "QUAN_TRI"],
    allowedFromStatuses: ["DA_TIEP_NHAN", "DANG_THAM_DINH", "CHO_PHE_DUYET"],
    targetStatus: "KEEP",
    description: "Gia hạn thời gian giải quyết (tối đa 01 lần) kèm Phiếu xin lỗi và hẹn lại ngày trả kết quả.",
  },
  TRA_KET_QUA: {
    code: "TRA_KET_QUA",
    label: "Trả kết quả giải quyết cho Công dân",
    allowedRoles: ["MOT_CUA", "QUAN_TRI"],
    allowedFromStatuses: ["CHO_TRA_KET_QUA"],
    targetStatus: "HOAN_THANH",
    description: "Kiểm tra nghĩa vụ tài chính (lệ phí), bàn giao kết quả và hoàn tất hồ sơ.",
  },
  RUT_HO_SO: {
    code: "RUT_HO_SO",
    label: "Đề nghị rút hồ sơ",
    allowedRoles: ["CONG_DAN", "MOT_CUA", "QUAN_TRI"],
    allowedFromStatuses: ["MOI_NOP", "DA_TIEP_NHAN", "YEU_CAU_BO_SUNG", "DANG_THAM_DINH"],
    targetStatus: "DA_RUT_HO_SO",
    description: "Công dân rút hồ sơ trước khi cơ quan có thẩm quyền ký ban hành kết quả giải quyết.",
  },
};

export interface WorkflowValidationContext {
  action: WorkflowActionCode;
  actorRole: Role;
  actorId: string;
  currentStatus: DossierStatus;
  applicantId: string | null;
  feeAmount: number;
  feeExempt: boolean;
  feeStatus: FeeStatus;
  supplementCount: number;
  extendedCount: number;
  mandatoryUnverifiedCount: number;
  payload: {
    note?: string;
    assigneeId?: string;
    supplementReason?: string;
    rejectionReason?: string;
    rejectionLegalBasis?: string;
    appraisalNote?: string;
    resultDocNumber?: string;
    resultSummary?: string;
    apologyReason?: string;
    extraWorkingDays?: number;
  };
}

export function validateWorkflowTransition(ctx: WorkflowValidationContext): {
  valid: boolean;
  error?: string;
  nextStatus: DossierStatus;
} {
  const rule = WORKFLOW_RULES[ctx.action];
  if (!rule) {
    return { valid: false, error: "Thao tác nghiệp vụ không hợp lệ.", nextStatus: ctx.currentStatus };
  }

  if (!rule.allowedRoles.includes(ctx.actorRole)) {
    return {
      valid: false,
      error: `Vai trò [${ROLE_LABELS[ctx.actorRole]}] không có thẩm quyền thực hiện thao tác "${rule.label}".`,
      nextStatus: ctx.currentStatus,
    };
  }

  if (!rule.allowedFromStatuses.includes(ctx.currentStatus)) {
    return {
      valid: false,
      error: `Không thể thực hiện "${rule.label}" khi hồ sơ đang ở trạng thái "${DOSSIER_STATUS_LABELS[ctx.currentStatus]}".`,
      nextStatus: ctx.currentStatus,
    };
  }

  // Công dân chỉ được thao tác trên hồ sơ của chính mình
  if (ctx.actorRole === "CONG_DAN" && ctx.applicantId !== ctx.actorId) {
    return {
      valid: false,
      error: "Công dân chỉ được phép thao tác trên hồ sơ do chính mình đứng tên nộp.",
      nextStatus: ctx.currentStatus,
    };
  }

  // Các ràng buộc nghiệp vụ cứng cho từng bước:
  if (ctx.action === "YEU_CAU_BO_SUNG") {
    if (ctx.supplementCount >= 1) {
      return {
        valid: false,
        error:
          "CHẶN PHÁP LÝ (Khoản 3 Điều 15 Nghị định 61/2018/NĐ-CP): Cơ quan giải quyết TTHC chỉ được phép yêu cầu bổ sung, hoàn thiện hồ sơ TỐI ĐA 01 LẦN.",
        nextStatus: ctx.currentStatus,
      };
    }
    if (!ctx.payload.supplementReason || ctx.payload.supplementReason.trim().length < 10) {
      return {
        valid: false,
        error: "Bắt buộc nêu rõ thành phần hồ sơ còn thiếu và hướng dẫn cụ thể (tối thiểu 10 ký tự) để xuất Phiếu yêu cầu bổ sung (Mẫu 02).",
        nextStatus: ctx.currentStatus,
      };
    }
  }

  if (ctx.action === "CHUYEN_CHUYEN_VIEN") {
    if (!ctx.payload.assigneeId) {
      return {
        valid: false,
        error: "Vui lòng chọn Chuyên viên tiếp nhận bàn giao hồ sơ.",
        nextStatus: ctx.currentStatus,
      };
    }
  }

  if (ctx.action === "TU_CHOI_TIEP_NHAN") {
    if (!ctx.payload.rejectionReason || ctx.payload.rejectionReason.trim().length < 10) {
      return {
        valid: false,
        error: "Bắt buộc nhập lý do từ chối cụ thể (tối thiểu 10 ký tự) theo quy định Mẫu số 03.",
        nextStatus: ctx.currentStatus,
      };
    }
    if (!ctx.payload.rejectionLegalBasis || ctx.payload.rejectionLegalBasis.trim().length < 5) {
      return {
        valid: false,
        error: "Bắt buộc viện dẫn căn cứ pháp lý từ chối tiếp nhận giải quyết hồ sơ.",
        nextStatus: ctx.currentStatus,
      };
    }
  }

  if (ctx.action === "TRINH_PHE_DUYET") {
    if (ctx.mandatoryUnverifiedCount > 0) {
      return {
        valid: false,
        error: `Còn ${ctx.mandatoryUnverifiedCount} thành phần hồ sơ bắt buộc chưa được kiểm tra/đối chiếu tính pháp lý. Vui lòng tích xác nhận đối chiếu thành phần hồ sơ trước khi trình Lãnh đạo ký duyệt.`,
        nextStatus: ctx.currentStatus,
      };
    }
    if (!ctx.payload.appraisalNote || ctx.payload.appraisalNote.trim().length < 10) {
      return {
        valid: false,
        error: "Chuyên viên bắt buộc nhập ý kiến thẩm định chuyên môn và đề xuất giải quyết trước khi trình ký.",
        nextStatus: ctx.currentStatus,
      };
    }
  }

  if (ctx.action === "PHE_DUYET_KET_QUA") {
    if (!ctx.payload.resultDocNumber || ctx.payload.resultDocNumber.trim().length < 4) {
      return {
        valid: false,
        error: "Bắt buộc cấp Số ký hiệu văn bản/giấy phép kết quả giải quyết (ví dụ: 215/GXN-UBND).",
        nextStatus: ctx.currentStatus,
      };
    }
    if (!ctx.payload.resultSummary || ctx.payload.resultSummary.trim().length < 8) {
      return {
        valid: false,
        error: "Bắt buộc nhập trích yếu nội dung kết quả phê duyệt.",
        nextStatus: ctx.currentStatus,
      };
    }
  }

  if (ctx.action === "THU_LE_PHI") {
    if (ctx.feeExempt || ctx.feeAmount <= 0 || ctx.feeStatus === "MIEN_PHI") {
      return {
        valid: false,
        error: "Hồ sơ này thuộc diện miễn lệ phí hoặc không phát sinh phí hành chính.",
        nextStatus: ctx.currentStatus,
      };
    }
    if (ctx.feeStatus === "DA_THU_PHI") {
      return {
        valid: false,
        error: "Hồ sơ này đã hoàn thành thu lệ phí và đã xuất biên lai điện tử.",
        nextStatus: ctx.currentStatus,
      };
    }
  }

  if (ctx.action === "GIA_HAN_XIN_LOI") {
    if (ctx.extendedCount >= 1) {
      return {
        valid: false,
        error: "Theo quy định cơ chế Một cửa, mỗi hồ sơ chỉ được phép gia hạn thời gian giải quyết tối đa 01 lần.",
        nextStatus: ctx.currentStatus,
      };
    }
    if (!ctx.payload.apologyReason || ctx.payload.apologyReason.trim().length < 10) {
      return {
        valid: false,
        error: "Bắt buộc nhập lý do chậm trễ/gia hạn để ban hành Phiếu xin lỗi và hẹn lại ngày trả kết quả (Mẫu 04).",
        nextStatus: ctx.currentStatus,
      };
    }
    const extraDays = ctx.payload.extraWorkingDays ?? 0;
    if (extraDays < 1 || extraDays > 15) {
      return {
        valid: false,
        error: "Số ngày làm việc xin gia hạn phải từ 01 đến 15 ngày làm việc.",
        nextStatus: ctx.currentStatus,
      };
    }
  }

  if (ctx.action === "TRA_KET_QUA") {
    if (!ctx.feeExempt && ctx.feeAmount > 0 && ctx.feeStatus !== "DA_THU_PHI") {
      return {
        valid: false,
        error: `CHẶN NGHIỆP VỤ TÀI CHÍNH: Hồ sơ có mức lệ phí ${ctx.feeAmount.toLocaleString("vi-VN")} đồng nhưng CHƯA THU LỆ PHÍ. Bắt buộc thu phí và cấp Biên lai điện tử trước khi trả kết quả!`,
        nextStatus: ctx.currentStatus,
      };
    }
  }

  const nextStatus = rule.targetStatus === "KEEP" ? ctx.currentStatus : rule.targetStatus;
  return { valid: true, nextStatus };
}

export const ROLE_LABELS: Record<Role, string> = {
  CONG_DAN: "Công dân / Tổ chức",
  MOT_CUA: "Cán bộ Một cửa",
  CHUYEN_VIEN: "Chuyên viên Thụ lý",
  LANH_DAO: "Lãnh đạo Phê duyệt",
  QUAN_TRI: "Quản trị & Văn thư",
};

export const DOSSIER_STATUS_LABELS: Record<DossierStatus, string> = {
  MOI_NOP: "Mới nộp (Chờ tiếp nhận)",
  DA_TIEP_NHAN: "Đã tiếp nhận (Mẫu 01)",
  YEU_CAU_BO_SUNG: "Chờ bổ sung hồ sơ (Mẫu 02)",
  DANG_THAM_DINH: "Đang thẩm định chuyên môn",
  CHO_PHE_DUYET: "Chờ Lãnh đạo ký duyệt",
  CHO_TRA_KET_QUA: "Đã ký duyệt - Chờ trả KQ",
  HOAN_THANH: "Đã trả kết quả (Hoàn thành)",
  TU_CHOI_TIEP_NHAN: "Từ chối tiếp nhận (Mẫu 03)",
  DA_RUT_HO_SO: "Đã rút hồ sơ",
};

export const FEE_STATUS_LABELS: Record<FeeStatus, string> = {
  MIEN_PHI: "Miễn lệ phí (0 đ)",
  CHUA_THU_PHI: "Chưa nộp lệ phí",
  DA_THU_PHI: "Đã thu lệ phí",
  HOAN_PHI: "Đã hoàn lệ phí",
};

export function getAvailableActions(params: {
  role: Role;
  userId: string;
  userDepartmentId?: string | null;
  dossierDepartmentId?: string | null;
  applicantId: string | null;
  status: DossierStatus;
  feeAmount: number;
  feeExempt: boolean;
  feeStatus: FeeStatus;
  supplementCount: number;
  extendedCount: number;
}): WorkflowRuleDefinition[] {
  return Object.values(WORKFLOW_RULES).filter((rule) => {
    if (!rule.allowedRoles.includes(params.role)) return false;
    if (!rule.allowedFromStatuses.includes(params.status)) return false;
    if (params.role === "CONG_DAN" && params.applicantId !== params.userId) return false;
    if (
      params.role === "CHUYEN_VIEN" &&
      params.userDepartmentId &&
      params.dossierDepartmentId &&
      params.userDepartmentId !== params.dossierDepartmentId
    ) {
      return false;
    }
    if (
      rule.code === "THU_LE_PHI" &&
      (params.feeExempt || params.feeAmount <= 0 || params.feeStatus === "DA_THU_PHI" || params.feeStatus === "MIEN_PHI")
    ) {
      return false;
    }
    if (
      rule.code === "TRA_KET_QUA" &&
      !params.feeExempt &&
      params.feeAmount > 0 &&
      params.feeStatus !== "DA_THU_PHI"
    ) {
      return false;
    }
    if (rule.code === "YEU_CAU_BO_SUNG" && params.supplementCount >= 1) {
      return false;
    }
    if (rule.code === "GIA_HAN_XIN_LOI" && params.extendedCount >= 1) {
      return false;
    }
    return true;
  });
}
