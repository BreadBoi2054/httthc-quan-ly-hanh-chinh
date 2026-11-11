import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
  password: z.string().min(4, "Mật khẩu tối thiểu 4 ký tự"),
});

export const createDossierSchema = z
  .object({
    procedureId: z.string().min(1, "Vui lòng chọn Thủ tục hành chính"),
    applicantName: z
      .string()
      .trim()
      .min(3, "Họ và tên người yêu cầu phải có ít nhất 3 ký tự")
      .max(100),
    applicantCitizenId: z
      .string()
      .trim()
      .regex(/^(?:\d{12}|\d{10}(?:-\d{3})?)$/, "Số CCCD phải gồm đúng 12 chữ số (hoặc Mã số thuế 10/13 số)"),
    applicantPhone: z
      .string()
      .trim()
      .regex(/^0\d{9}$/, "Số điện thoại liên hệ phải gồm 10 chữ số, bắt đầu bằng số 0"),
    applicantEmail: z
      .string()
      .trim()
      .email("Địa chỉ thư điện tử không đúng định dạng")
      .optional()
      .or(z.literal("")),
    applicantAddress: z.string().trim().min(8, "Vui lòng ghi rõ địa chỉ thường trú / trụ sở (tối thiểu 8 ký tự)"),
    applicantBirthYear: z.coerce
      .number()
      .int()
      .min(1920, "Năm sinh không hợp lệ")
      .max(2026, "Năm sinh không hợp lệ")
      .optional(),
    hasAuthorization: z.boolean().optional().default(false),
    representativeName: z.string().trim().optional().or(z.literal("")),
    representativeCitizenId: z.string().trim().optional().or(z.literal("")),
    authorizationNote: z.string().trim().optional().or(z.literal("")),
    channel: z.enum(["TRUC_TUYEN", "TRUC_TIEP", "BUU_CHINH"]).default("TRUC_TUYEN"),
    autoAccept: z.boolean().optional().default(false),
    summary: z.string().trim().min(10, "Vui lòng mô tả rõ nội dung đề nghị giải quyết (tối thiểu 10 ký tự)"),
    copiesCount: z.coerce.number().int().min(1).max(50).default(1),
    feeExempt: z.boolean().default(false),
    feeExemptReason: z.string().trim().optional().or(z.literal("")),
    attachments: z
      .array(
        z.object({
          docCode: z.string().min(1).max(40),
          docName: z.string().min(1).max(250),
          isMandatory: z.boolean().default(true),
          submittedType: z.enum(["BAN_CHINH", "BAN_SAO_CHUNG_THUC", "BAN_DIEN_TU"]).default("BAN_DIEN_TU"),
          quantity: z.coerce.number().int().min(1).max(20).default(1),
          fileName: z.string().trim().min(1, "Vui lòng đính kèm hoặc kê khai tên tệp tài liệu").max(200),
          reusedFromVault: z.boolean().optional().default(false),
        })
      )
      .min(1, "Hồ sơ phải đính kèm tối thiểu 01 thành phần tài liệu")
      .max(25, "Số lượng thành phần hồ sơ đính kèm tối đa 25 mục"),
  })
  .superRefine((data, ctx) => {
    if (data.hasAuthorization) {
      if (!data.representativeName || data.representativeName.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["representativeName"],
          message: "Trường hợp ủy quyền bắt buộc kê khai họ tên người được ủy quyền",
        });
      }
      if (!data.representativeCitizenId || !/^\d{12}$/.test(data.representativeCitizenId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["representativeCitizenId"],
          message: "Số CCCD của người được ủy quyền phải gồm đúng 12 chữ số",
        });
      }
      if (!data.authorizationNote || data.authorizationNote.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["authorizationNote"],
          message: "Vui lòng ghi rõ số/ngày Văn bản ủy quyền hợp pháp",
        });
      }
    }
    if (data.feeExempt && (!data.feeExemptReason || data.feeExemptReason.length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["feeExemptReason"],
        message: "Trường hợp đề nghị miễn lệ phí bắt buộc nêu rõ đối tượng/căn cứ miễn lệ phí",
      });
    }
  });

export const workflowActionSchema = z.object({
  action: z.enum([
    "TIEP_NHAN",
    "YEU_CAU_BO_SUNG",
    "TU_CHOI_TIEP_NHAN",
    "BO_SUNG_HO_SO",
    "NHAN_THAM_DINH",
    "CHUYEN_CHUYEN_VIEN",
    "TRINH_PHE_DUYET",
    "PHE_DUYET_KET_QUA",
    "TRA_LAI_THAM_DINH",
    "THU_LE_PHI",
    "GIA_HAN_XIN_LOI",
    "TRA_KET_QUA",
    "RUT_HO_SO",
  ]),
  note: z.string().trim().optional(),
  assigneeId: z.string().optional(),
  supplementReason: z.string().trim().optional(),
  rejectionReason: z.string().trim().optional(),
  rejectionLegalBasis: z.string().trim().optional(),
  appraisalNote: z.string().trim().optional(),
  leaderNote: z.string().trim().optional(),
  resultDocNumber: z.string().trim().optional(),
  resultSummary: z.string().trim().optional(),
  apologyReason: z.string().trim().max(1000).optional(),
  extraWorkingDays: z.coerce.number().int().min(1).max(15).optional(),
  verifiedAttachmentIds: z.array(z.string().max(64)).max(30).optional(),
  newAttachmentName: z.string().trim().max(200).optional(),
});

export const createDocumentSchema = z.object({
  direction: z.enum(["DEN", "DI"]),
  documentSymbol: z
    .string()
    .trim()
    .min(4, "Số ký hiệu văn bản phải đúng quy chuẩn (ví dụ: 145/UBND-TP)"),
  docType: z.enum([
    "QUYET_DINH",
    "CONG_VAN",
    "TO_TRINH",
    "THONG_BAO",
    "BAO_CAO",
    "KE_HOACH",
    "GIAY_XAC_NHAN",
  ]),
  urgency: z.enum(["THUONG", "KHAN", "THUONG_KHAN", "HOA_TOC"]).default("THUONG"),
  security: z.enum(["THUONG", "MAT", "TOI_MAT"]).default("THUONG"),
  title: z.string().trim().min(10, "Trích yếu nội dung văn bản tối thiểu 10 ký tự"),
  contentSummary: z.string().trim().min(10, "Nội dung tóm tắt tối thiểu 10 ký tự"),
  issuingAgency: z.string().trim().min(3, "Vui lòng nhập cơ quan ban hành"),
  recipientAgency: z.string().trim().min(3, "Vui lòng nhập nơi nhận"),
  signerName: z.string().trim().optional(),
  signerTitle: z.string().trim().optional(),
  issuedDate: z.string().min(10, "Ngày văn bản không hợp lệ"),
  processingDeadline: z.string().optional().or(z.literal("")),
  leadDepartmentId: z.string().optional().or(z.literal("")),
  assigneeId: z.string().optional().or(z.literal("")),
});

export const updateDocumentActionSchema = z.object({
  action: z.enum([
    "BUT_PHE_PHAN_CONG",
    "CAP_NHAT_XU_LY",
    "KY_BAN_HANH",
    "TRA_LAI_DU_THAO",
    "LUU_TRU",
  ]),
  directiveNote: z.string().trim().optional(),
  resolutionNote: z.string().trim().optional(),
  leadDepartmentId: z.string().optional(),
  assigneeId: z.string().optional(),
  signerName: z.string().trim().optional(),
  signerTitle: z.string().trim().optional(),
});

export const satisfactionSchema = z.object({
  trackingPin: z.string().trim().min(4, "Vui lòng nhập Mã PIN tra cứu trên Giấy tiếp nhận"),
  rating: z.enum(["RAT_HAI_LONG", "HAI_LONG", "BINH_THUONG", "CHUA_HAI_LONG"]),
  comment: z.string().trim().max(500).optional(),
});
