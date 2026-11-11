"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DossierStatusBadge,
  FeeBadge,
  RoleBadge,
  SlaBadge,
} from "@/components/StatusBadges";
import {
  FormTemplateType,
  OfficialFormsPrintModal,
} from "@/components/OfficialFormsPrint";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Printer,
  ShieldAlert,
  Star,
  UserCheck,
} from "lucide-react";

interface AttachmentItem {
  id: string;
  docCode: string;
  docName: string;
  isMandatory: boolean;
  submittedType: string;
  quantity: number;
  fileName: string | null;
  isVerified: boolean;
  reusedFromVault?: boolean;
}

interface HistoryItem {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  actionName: string;
  actorName: string;
  actorRole: string;
  note: string | null;
  createdAt: string;
}

interface SpecialistItem {
  id: string;
  fullName: string;
  positionTitle: string | null;
}

interface LinkedDocItem {
  id: string;
  direction: string;
  documentSymbol: string;
  title: string;
  status: string;
  issuedDate: string;
}

interface DossierDetail {
  id: string;
  dossierCode: string;
  trackingPin: string;
  status: string;
  channel: string;
  applicantName: string;
  applicantCitizenId: string;
  applicantPhone: string;
  applicantEmail: string | null;
  applicantAddress: string;
  representativeName: string | null;
  representativeCitizenId: string | null;
  authorizationNote: string | null;
  summary: string;
  copiesCount: number;
  feeAmount: number;
  feeExempt: boolean;
  feeExemptReason: string | null;
  feeStatus: string;
  receiptNumber: string | null;
  paidAt: string | null;
  submittedAt: string;
  acceptedAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  slaPausedAt: string | null;
  totalPausedMinutes: number;
  supplementCount: number;
  extendedCount: number;
  apologyFormCode: string | null;
  apologyReason: string | null;
  supplementReason: string | null;
  supplementDeadline: string | null;
  rejectionReason: string | null;
  rejectionLegalBasis: string | null;
  appraisalNote: string | null;
  leaderNote: string | null;
  resultDocNumber: string | null;
  resultSummary: string | null;
  isDigitizedResult?: boolean;
  electronicResultCode?: string | null;
  satisfactionRating: string | null;
  satisfactionComment: string | null;
  procedure: {
    id: string;
    code: string;
    name: string;
    field: string;
    serviceLevel: string;
    processingDays: number;
    processingHours: number;
    legalBasis: string;
  };
  department: {
    id: string;
    code: string;
    name: string;
    roomNumber: string;
    phoneExt: string;
  };
  receiver: { id: string; fullName: string; positionTitle: string | null } | null;
  assignee: { id: string; fullName: string; positionTitle: string | null } | null;
  approver: { id: string; fullName: string; positionTitle: string | null } | null;
  attachments: AttachmentItem[];
  histories: HistoryItem[];
  linkedDocuments: LinkedDocItem[];
  sla: {
    state: string;
    label: string;
    isOverdue: boolean;
  };
  availableActions: Array<{
    code: string;
    label: string;
    description: string;
  }>;
  specialists: SpecialistItem[];
}

const SIPAS_LABELS: Record<string, string> = {
  RAT_HAI_LONG: "Rất hài lòng (5/5 - Mức cao nhất Bộ chỉ số 766)",
  HAI_LONG: "Hài lòng (4/5)",
  BINH_THUONG: "Bình thường (3/5)",
  CHUA_HAI_LONG: "Chưa hài lòng (Cần rút kinh nghiệm)",
};

export default function StaffDossierDetailPage() {
  const params = useParams<{ id: string }>();
  const dossierId = params?.id || "";

  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedAction, setSelectedAction] = useState<string>("");
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [note, setNote] = useState("");
  const [supplementReason, setSupplementReason] = useState("");
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionLegalBasis, setRejectionLegalBasis] = useState(
    "Điều 17 Nghị định 61/2018/NĐ-CP và Nghị định 107/2021/NĐ-CP"
  );
  const [appraisalNote, setAppraisalNote] = useState("");
  const [leaderNote, setLeaderNote] = useState("");
  const [resultDocNumber, setResultDocNumber] = useState("");
  const [resultSummary, setResultSummary] = useState("");
  const [apologyReason, setApologyReason] = useState("");
  const [extraWorkingDays, setExtraWorkingDays] = useState(3);

  const [printFormType, setPrintFormType] = useState<FormTemplateType | null>(null);

  const loadDossier = useCallback(async () => {
    if (!dossierId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dossiers/${encodeURIComponent(dossierId)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể tải thông tin hồ sơ.");
        setDossier(null);
        return;
      }
      const d: DossierDetail = data.dossier;
      setDossier(d);
      setVerifiedIds(d.attachments.filter((a) => a.isVerified).map((a) => a.id));
      setAssigneeId(d.assignee?.id || d.specialists[0]?.id || "");
      if (d.availableActions.length > 0) {
        setSelectedAction((prev) =>
          d.availableActions.some((a) => a.code === prev)
            ? prev
            : d.availableActions[0].code
        );
      } else {
        setSelectedAction("");
      }
      if (d.procedure) {
        setResultDocNumber(
          (prev) => prev || `${d.dossierCode.slice(-4)}/GXN-UBND-${d.department.code}`
        );
        setResultSummary(
          (prev) =>
            prev || `Cấp kết quả giải quyết TTHC: ${d.procedure.name} cho ông/bà ${d.applicantName}`
        );
      }
    } catch {
      setError("Lỗi kết nối máy chủ khi truy vấn hồ sơ.");
    } finally {
      setLoading(false);
    }
  }, [dossierId]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  function toggleAttachmentVerify(attId: string) {
    setVerifiedIds((prev) =>
      prev.includes(attId) ? prev.filter((x) => x !== attId) : [...prev, attId]
    );
  }

  function verifyAllAttachments() {
    if (!dossier) return;
    setVerifiedIds(dossier.attachments.map((a) => a.id));
  }

  async function handleExecuteWorkflow(e: React.FormEvent) {
    e.preventDefault();
    if (!dossier || !selectedAction) return;
    setSubmitting(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/dossiers/${dossier.id}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: selectedAction,
          assigneeId: assigneeId || undefined,
          verifiedAttachmentIds: verifiedIds,
          note: note.trim() || undefined,
          supplementReason: supplementReason.trim() || undefined,
          newAttachmentName: newAttachmentName.trim() || undefined,
          rejectionReason: rejectionReason.trim() || undefined,
          rejectionLegalBasis: rejectionLegalBasis.trim() || undefined,
          appraisalNote: appraisalNote.trim() || undefined,
          leaderNote: leaderNote.trim() || undefined,
          resultDocNumber: resultDocNumber.trim() || undefined,
          resultSummary: resultSummary.trim() || undefined,
          apologyReason: apologyReason.trim() || undefined,
          extraWorkingDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Không thể thực thi bước nghiệp vụ.");
        return;
      }

      setActionSuccess(
        `Đã thực thi thành công thao tác nghiệp vụ trên hồ sơ ${dossier.dossierCode}.`
      );
      setNote("");
      setSupplementReason("");
      setNewAttachmentName("");
      setRejectionReason("");
      setApologyReason("");
      await loadDossier();
    } catch {
      setActionError("Lỗi mạng khi gửi lệnh xử lý quy trình.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-[#4b5563]">
        Đang tải chi tiết hồ sơ hành chính và nhật ký luân chuyển...
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="space-y-4">
        <Link
          href="/he-thong/ho-so"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1e3a5f] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Sổ theo dõi Hồ sơ Một cửa
        </Link>
        <div className="p-4 border border-[#dc2626] bg-[#fef2f2] text-[#991b1b] text-sm rounded-[2px]">
          {error || "Hồ sơ không tồn tại."}
        </div>
      </div>
    );
  }

  const mandatoryUnverified = dossier.attachments.filter(
    (att) => att.isMandatory && !verifiedIds.includes(att.id)
  ).length;

  const needsFeeGateWarning =
    dossier.status === "CHO_TRA_KET_QUA" &&
    !dossier.feeExempt &&
    dossier.feeAmount > 0 &&
    dossier.feeStatus !== "DA_THU_PHI";

  return (
    <div className="space-y-6">
      {/* Thanh điều hướng & Biểu mẫu In Khổ A4 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-[#d6d3cd]">
        <div className="space-y-1">
          <Link
            href="/he-thong/ho-so"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1e3a5f] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại Danh sách Hồ sơ Một cửa
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] font-official-serif tabular-nums">
              Hồ sơ {dossier.dossierCode}
            </h1>
            <DossierStatusBadge status={dossier.status} />
            <SlaBadge state={dossier.sla.state} label={dossier.sla.label} />
            <FeeBadge status={dossier.feeStatus} amount={dossier.feeAmount} />
          </div>
          <p className="text-xs text-[#4b5563]">
            Mã PIN tra cứu công dân:{" "}
            <strong className="text-[#991b1b] font-mono">{dossier.trackingPin}</strong> • Kênh nộp:{" "}
            <strong>
              {dossier.channel === "TRUC_TUYEN"
                ? "Dịch vụ công Trực tuyến"
                : dossier.channel === "BUU_CHINH"
                ? "Dịch vụ Bưu chính công ích"
                : "Trực tiếp tại Quầy Một cửa"}
            </strong>{" "}
            • Phòng chủ trì: <strong>{dossier.department.name}</strong> ({dossier.department.roomNumber})
          </p>
        </div>

        {/* Nhóm nút In Biểu mẫu hành chính A4 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPrintFormType("MAU_01")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-[#1e3a5f] text-[#1e3a5f] bg-[#f8fafc] hover:bg-[#e2e8f0] rounded-[2px] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Mẫu 01 (Tiếp nhận)
          </button>
          <button
            type="button"
            onClick={() => setPrintFormType("MAU_05")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-[#374151] text-[#111827] bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-[2px] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Mẫu 05 (Phiếu kiểm soát)
          </button>
          {dossier.supplementReason && (
            <button
              type="button"
              onClick={() => setPrintFormType("MAU_02")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-[#ea580c] text-[#9a3412] bg-[#fff7ed] hover:bg-[#ffedd5] rounded-[2px] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Mẫu 02 (Bổ sung)
            </button>
          )}
          {dossier.rejectionReason && (
            <button
              type="button"
              onClick={() => setPrintFormType("MAU_03")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-[#dc2626] text-[#991b1b] bg-[#fef2f2] hover:bg-[#fee2e2] rounded-[2px] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Mẫu 03 (Từ chối)
            </button>
          )}
          {dossier.apologyFormCode && (
            <button
              type="button"
              onClick={() => setPrintFormType("MAU_04")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-[#b45309] text-[#92400e] bg-[#fffbeb] hover:bg-[#fef3c7] rounded-[2px] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Mẫu 04 (Phiếu xin lỗi)
            </button>
          )}
          {(dossier.receiptNumber || (!dossier.feeExempt && dossier.feeAmount > 0)) && (
            <button
              type="button"
              onClick={() => setPrintFormType("BIEN_LAI")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-[#15803d] text-[#166534] bg-[#f0fdf4] hover:bg-[#dcfce7] rounded-[2px] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Biên lai Lệ phí
            </button>
          )}
        </div>
      </div>

      {/* Thông báo kết quả thao tác */}
      {actionSuccess && (
        <div className="p-3 border border-[#16a34a] bg-[#f0fdf4] text-[#166534] text-sm font-medium rounded-[2px] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 border border-[#dc2626] bg-[#fef2f2] text-[#991b1b] text-sm font-medium rounded-[2px] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Cảnh báo Chốt chặn Tài chính trước khi trả kết quả */}
      {needsFeeGateWarning && (
        <div className="p-3.5 border-l-4 border-[#d97706] bg-[#fffbeb] text-[#92400e] text-xs space-y-1">
          <p className="font-bold uppercase">
            Chốt chặn Nghiệp vụ Tài chính (Nghị định 61/2018/NĐ-CP):
          </p>
          <p>
            Hồ sơ này đã được Lãnh đạo ký duyệt kết quả (<strong>{dossier.resultDocNumber}</strong>), nhưng{" "}
            <strong>chưa hoàn thành nghĩa vụ nộp lệ phí ({dossier.feeAmount.toLocaleString("vi-VN")} đồng)</strong>. Hệ thống tự động khóa nút{" "}
            <em>Trả kết quả & Hoàn thành</em> cho đến khi Cán bộ Một cửa thực hiện{" "}
            <strong>Xác nhận thu lệ phí & Xuất biên lai</strong> hoặc Công dân thanh toán trực tuyến.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Cột Trái (7/12): Thông tin hồ sơ, thành phần giấy tờ & nhật ký */}
        <div className="xl:col-span-7 space-y-5">
          {/* Khối 1: Thông tin Thủ tục & Chủ hồ sơ */}
          <section className="border border-[#d6d3cd] rounded-[2px] overflow-hidden">
            <div className="bg-[#f4f1ea] px-4 py-2.5 border-b border-[#d6d3cd] flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f]">
                1. Thông tin Chủ hồ sơ & Yêu cầu giải quyết TTHC
              </h2>
              <span className="text-[11px] font-semibold text-[#991b1b]">
                [{dossier.procedure.code}] • {dossier.procedure.field}
              </span>
            </div>
            <div className="p-4 text-sm space-y-3">
              <div>
                <p className="text-xs text-[#6b7280]">Tên Thủ tục hành chính</p>
                <p className="font-bold text-[#111827]">{dossier.procedure.name}</p>
                <p className="text-xs text-[#4b5563] mt-0.5">
                  Căn cứ pháp lý: {dossier.procedure.legalBasis}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#e5e7eb] text-xs">
                <div>
                  <span className="text-[#6b7280] block">Họ và tên người yêu cầu:</span>
                  <strong className="text-sm text-[#111827]">{dossier.applicantName}</strong>
                </div>
                <div className="tabular-nums">
                  <span className="text-[#6b7280] block">Số Định danh cá nhân / CCCD:</span>
                  <strong className="text-sm text-[#111827]">{dossier.applicantCitizenId}</strong>
                </div>
                <div className="tabular-nums">
                  <span className="text-[#6b7280] block">Điện thoại / Thư điện tử:</span>
                  <strong className="text-[#111827]">
                    {dossier.applicantPhone}
                    {dossier.applicantEmail ? ` • ${dossier.applicantEmail}` : ""}
                  </strong>
                </div>
                <div>
                  <span className="text-[#6b7280] block">Số bản cấp / Mức thu lệ phí:</span>
                  <strong className="text-[#111827] tabular-nums">
                    {dossier.copiesCount} bản •{" "}
                    {dossier.feeExempt
                      ? `Miễn phí (${dossier.feeExemptReason || "Đối tượng chính sách"})`
                      : `${dossier.feeAmount.toLocaleString("vi-VN")} đồng`}
                  </strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#6b7280] block">Địa chỉ thường trú / Liên hệ:</span>
                  <span className="font-medium text-[#111827]">{dossier.applicantAddress}</span>
                </div>
                {dossier.representativeName && (
                  <div className="sm:col-span-2 p-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-[2px]">
                    <span className="font-bold text-[#1e3a5f]">Người được ủy quyền nộp thay: </span>
                    <strong>{dossier.representativeName}</strong> (CCCD:{" "}
                    <span className="tabular-nums">{dossier.representativeCitizenId}</span>) —{" "}
                    <span>{dossier.authorizationNote}</span>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="text-[#6b7280] block">Trích yếu nội dung yêu cầu:</span>
                  <p className="font-medium text-[#111827] bg-[#fafaf9] p-2.5 border border-[#e5e7eb] mt-1">
                    {dossier.summary}
                  </p>
                </div>
              </div>

              {/* Các mốc thời gian SLA & Phân công */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-[#e5e7eb] text-xs tabular-nums">
                <div className="p-2 bg-[#f9fafb] border border-[#e5e7eb]">
                  <span className="text-[#6b7280] block">Thời điểm nộp:</span>
                  <strong>{new Date(dossier.submittedAt).toLocaleString("vi-VN")}</strong>
                </div>
                <div className="p-2 bg-[#f9fafb] border border-[#e5e7eb]">
                  <span className="text-[#6b7280] block">Tiếp nhận chính thức:</span>
                  <strong>
                    {dossier.acceptedAt
                      ? new Date(dossier.acceptedAt).toLocaleString("vi-VN")
                      : "Chưa cấp Mẫu 01"}
                  </strong>
                </div>
                <div className="p-2 bg-[#f9fafb] border border-[#e5e7eb]">
                  <span className="text-[#6b7280] block">Hạn trả kết quả (SLA):</span>
                  <strong className={dossier.sla.isOverdue ? "text-[#b91c1c]" : "text-[#1e3a5f]"}>
                    {dossier.dueAt
                      ? new Date(dossier.dueAt).toLocaleString("vi-VN")
                      : `${dossier.procedure.processingDays} ngày làm việc`}
                  </strong>
                </div>
                <div className="p-2 bg-[#f9fafb] border border-[#e5e7eb]">
                  <span className="text-[#4b5563] block">Bổ sung / Gia hạn:</span>
                  <strong>
                    BS {dossier.supplementCount}/1 • Gia hạn {dossier.extendedCount}/1 ({dossier.totalPausedMinutes}p bù)
                  </strong>
                </div>
              </div>

              {/* Nhân sự phụ trách */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
                <div className="p-2 border border-[#e5e7eb] rounded-[2px]">
                  <span className="text-[#6b7280] block">Công chức Tiếp nhận:</span>
                  <strong>{dossier.receiver?.fullName || "Chờ tiếp nhận"}</strong>
                </div>
                <div className="p-2 border border-[#e5e7eb] rounded-[2px]">
                  <span className="text-[#6b7280] block">Chuyên viên Thẩm định:</span>
                  <strong>{dossier.assignee?.fullName || "Chưa phân công"}</strong>
                </div>
                <div className="p-2 border border-[#e5e7eb] rounded-[2px]">
                  <span className="text-[#6b7280] block">Lãnh đạo Ký duyệt:</span>
                  <strong>{dossier.approver?.fullName || "Chờ trình ký"}</strong>
                </div>
              </div>
            </div>
          </section>

          {/* Khối 2: Danh mục Thành phần hồ sơ & Kiểm tra pháp lý */}
          <section className="border border-[#d6d3cd] rounded-[2px] overflow-hidden">
            <div className="bg-[#f4f1ea] px-4 py-2.5 border-b border-[#d6d3cd] flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-[#991b1b]" />
                2. Kiểm soát Tính pháp lý Thành phần Hồ sơ ({dossier.attachments.length} tài liệu)
              </h2>
              {dossier.availableActions.length > 0 && mandatoryUnverified > 0 && (
                <button
                  type="button"
                  onClick={verifyAllAttachments}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#1e3a5f] text-white hover:bg-[#172c48] rounded-[2px] cursor-pointer"
                >
                  Tích đối chiếu hợp lệ toàn bộ
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fafaf9] border-b border-[#d6d3cd] text-[#374151]">
                    <th className="py-2 px-3 text-left w-10">Đối chiếu</th>
                    <th className="py-2 px-3 text-left">Tên thành phần giấy tờ / Tài liệu đính kèm</th>
                    <th className="py-2 px-3 text-center">Bắt buộc</th>
                    <th className="py-2 px-3 text-center">Hình thức</th>
                    <th className="py-2 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {dossier.attachments.map((att) => {
                    const checked = verifiedIds.includes(att.id);
                    return (
                      <tr key={att.id} className="hover:bg-[#fafaf9]">
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={dossier.availableActions.length === 0}
                            onChange={() => toggleAttachmentVerify(att.id)}
                            aria-label={`Đối chiếu tài liệu ${att.docName}`}
                            className="w-4 h-4 accent-[#991b1b] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-[#111827] flex flex-wrap items-center gap-1.5">
                            <span>{att.docName}</span>
                            {att.reusedFromVault && (
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-[#eff6ff] text-[#1e3a5f] border border-[#93c5fd] rounded-[2px]">
                                Tái sử dụng Kho số hóa
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#6b7280]">
                            Mã: {att.docCode} • Tệp số hóa:{" "}
                            <span className="font-mono text-[#1e3a5f]">
                              {att.fileName || "Bản giấy đối chiếu trực tiếp"}
                            </span>
                          </p>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {att.isMandatory ? (
                            <span className="text-[#991b1b] font-bold">Bắt buộc</span>
                          ) : (
                            <span className="text-[#6b7280]">Nếu có</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {att.submittedType === "BAN_CHINH"
                            ? "Bản chính"
                            : att.submittedType === "BAN_SAO_CHUNG_THUC"
                            ? "Bản sao CT"
                            : "Bản điện tử"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {checked ? (
                            <span className="inline-block px-2 py-0.5 bg-[#dcfce7] text-[#166534] border border-[#86efac] font-semibold rounded-[2px]">
                              Đã đối chiếu
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-[#fef2f2] text-[#991b1b] border border-[#fecaca] font-semibold rounded-[2px]">
                              Chưa kiểm tra
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Khối 3: Ý kiến Thẩm định, Phê duyệt, Kết quả & Liên thông Văn bản đi */}
          {(dossier.appraisalNote ||
            dossier.leaderNote ||
            dossier.resultDocNumber ||
            dossier.supplementReason ||
            dossier.rejectionReason ||
            dossier.apologyReason ||
            dossier.satisfactionRating) && (
            <section className="border border-[#d6d3cd] rounded-[2px] overflow-hidden">
              <div className="bg-[#f4f1ea] px-4 py-2.5 border-b border-[#d6d3cd]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f]">
                  3. Kết luận Thẩm định, Bút phê Phê duyệt & Văn bản Kết quả
                </h2>
              </div>
              <div className="p-4 space-y-3 text-xs">
                {dossier.supplementReason && (
                  <div className="p-3 bg-[#fff7ed] border border-[#fdba74] text-[#9a3412]">
                    <p className="font-bold">Yêu cầu bổ sung hồ sơ (Mẫu 02):</p>
                    <p className="mt-0.5">{dossier.supplementReason}</p>
                  </div>
                )}
                {dossier.rejectionReason && (
                  <div className="p-3 bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b]">
                    <p className="font-bold">Lý do từ chối tiếp nhận (Mẫu 03):</p>
                    <p className="mt-0.5">{dossier.rejectionReason}</p>
                    <p className="mt-1 italic">Căn cứ: {dossier.rejectionLegalBasis}</p>
                  </div>
                )}
                {dossier.apologyReason && (
                  <div className="p-3 bg-[#fffbeb] border border-[#fcd34d] text-[#92400e]">
                    <p className="font-bold">
                      Phiếu xin lỗi và hẹn lại ngày trả kết quả ({dossier.apologyFormCode}):
                    </p>
                    <p className="mt-0.5">{dossier.apologyReason}</p>
                  </div>
                )}
                {dossier.appraisalNote && (
                  <div className="p-3 bg-[#f8fafc] border border-[#cbd5e1]">
                    <p className="font-bold text-[#1e3a5f]">
                      Báo cáo thẩm định chuyên môn ({dossier.assignee?.fullName}):
                    </p>
                    <p className="mt-1 text-[#111827]">{dossier.appraisalNote}</p>
                  </div>
                )}
                {dossier.leaderNote && (
                  <div className="p-3 bg-[#fefce8] border border-[#fde047]">
                    <p className="font-bold text-[#854d0e]">
                      Ý kiến phê duyệt của Lãnh đạo UBND ({dossier.approver?.fullName}):
                    </p>
                    <p className="mt-1 text-[#111827]">{dossier.leaderNote}</p>
                  </div>
                )}
                {dossier.resultDocNumber && (
                  <div className="p-3 bg-[#f0fdf4] border border-[#86efac] text-[#14532d]">
                    <p className="font-bold">
                      Văn bản kết quả đã ký ban hành: Số hiệu{" "}
                      <span className="underline">{dossier.resultDocNumber}</span>
                      {dossier.isDigitizedResult && dossier.electronicResultCode && (
                        <span className="ml-2 inline-block px-2 py-0.5 text-[10px] bg-[#166534] text-white rounded-[2px] font-mono">
                          Bản điện tử: {dossier.electronicResultCode}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5">{dossier.resultSummary}</p>
                    {dossier.linkedDocuments.length > 0 && (
                      <p className="mt-1.5 text-[11px]">
                        Đã tự động ghi sổ Văn bản đi:{" "}
                        <Link
                          href="/he-thong/van-ban"
                          className="font-bold underline hover:text-[#166534]"
                        >
                          Xem trong Sổ Quản lý Văn bản Điều hành →
                        </Link>
                      </p>
                    )}
                  </div>
                )}
                {dossier.satisfactionRating && (
                  <div className="p-3 bg-[#fffbeb] border border-[#f59e0b] flex items-start gap-2.5">
                    <Star className="w-4 h-4 text-[#d97706] fill-[#d97706] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#78350f]">
                        Đánh giá mức độ hài lòng SIPAS của công dân:{" "}
                        {SIPAS_LABELS[dossier.satisfactionRating] || dossier.satisfactionRating}
                      </p>
                      {dossier.satisfactionComment && (
                        <p className="mt-0.5 text-[#374151] italic">“{dossier.satisfactionComment}”</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Khối 4: Phiếu kiểm soát quá trình giải quyết hồ sơ (Mẫu 05) */}
          <section className="border border-[#d6d3cd] rounded-[2px] overflow-hidden">
            <div className="bg-[#f4f1ea] px-4 py-2.5 border-b border-[#d6d3cd] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1e3a5f]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f]">
                4. Phiếu Kiểm soát Quá trình Giải quyết Hồ sơ (Mẫu số 05 - Bất biến)
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {dossier.histories.map((h, idx) => (
                <div
                  key={h.id}
                  className="relative pl-5 pb-3 border-l-2 border-[#991b1b] last:pb-0 text-xs"
                >
                  <span className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-[#991b1b]" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#111827]">
                      Bước {idx + 1}: {h.actionName}
                    </span>
                    <span className="text-[#6b7280] tabular-nums">
                      {new Date(h.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-semibold text-[#1e3a5f]">{h.actorName}</span>
                    <RoleBadge role={h.actorRole} />
                    <DossierStatusBadge status={h.toStatus} />
                  </div>
                  {h.note && <p className="mt-1.5 text-[#374151] bg-[#fafaf9] p-2 border border-[#e5e7eb]">{h.note}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Cột Phải (5/12): Bàn tác nghiệp Xử lý Quy trình Một cửa */}
        <div className="xl:col-span-5">
          <div className="border-2 border-[#1e3a5f] bg-[#fafaf9] rounded-[2px] sticky top-4">
            <div className="bg-[#1e3a5f] text-white px-4 py-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#fbbf24]" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide">
                  Bàn Tác Nghiệp Luân Chuyển Hồ Sơ
                </h2>
                <p className="text-[11px] text-[#fde68a]">
                  Kiểm soát trạng thái chặt chẽ theo thẩm quyền RBAC & Phòng ban ABAC
                </p>
              </div>
            </div>

            <div className="p-4">
              {dossier.availableActions.length === 0 ? (
                <div className="p-4 bg-white border border-[#d6d3cd] text-xs text-[#4b5563] space-y-2">
                  <p className="font-bold text-[#111827]">
                    Không có thao tác chuyển tiếp khả dụng cho vai trò hiện tại ở trạng thái này.
                  </p>
                  <p>
                    - Nếu hồ sơ đang chờ bộ phận khác (Một cửa / Chuyên viên / Lãnh đạo), vui lòng chuyển đúng vai trò tương ứng để xử lý tiếp.
                  </p>
                  <p>
                    - Nếu hồ sơ ở trạng thái <strong>Chờ trả kết quả</strong> nhưng còn nợ lệ phí, hãy thực hiện thu lệ phí trước.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleExecuteWorkflow} className="space-y-4 text-xs">
                  {/* Chọn hành động nghiệp vụ */}
                  <div>
                    <label className="block font-bold text-[#111827] mb-1.5">
                      Chọn quyết định tác nghiệp ({dossier.availableActions.length} lựa chọn hợp lệ):
                    </label>
                    <div className="space-y-1.5">
                      {dossier.availableActions.map((act) => (
                        <label
                          key={act.code}
                          className={`flex items-start gap-2.5 p-2.5 border rounded-[2px] cursor-pointer transition-colors ${
                            selectedAction === act.code
                              ? "border-[#991b1b] bg-[#fef2f2]"
                              : "border-[#d6d3cd] bg-white hover:bg-[#f4f1ea]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="workflowAction"
                            value={act.code}
                            checked={selectedAction === act.code}
                            onChange={() => setSelectedAction(act.code)}
                            className="mt-0.5 accent-[#991b1b]"
                          />
                          <div>
                            <p className="font-bold text-[#111827]">{act.label}</p>
                            <p className="text-[11px] text-[#4b5563]">{act.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Trường động theo từng bước nghiệp vụ */}
                  {(selectedAction === "TIEP_NHAN" || selectedAction === "CHUYEN_CHUYEN_VIEN") && (
                    <div className="space-y-2 p-3 bg-white border border-[#d6d3cd]">
                      <label className="block font-bold text-[#1e3a5f]">
                        {selectedAction === "CHUYEN_CHUYEN_VIEN"
                          ? `Chọn Chuyên viên nhận điều chuyển (${dossier.department.name}) *:`
                          : `Phân công Chuyên viên thụ lý (${dossier.department.name}):`}
                      </label>
                      <select
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        className="w-full border border-[#9ca3af] px-2.5 py-2 bg-white rounded-[2px]"
                      >
                        {dossier.specialists.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.fullName} ({sp.positionTitle || "Chuyên viên"})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#4b5563]">
                        {selectedAction === "CHUYEN_CHUYEN_VIEN"
                          ? "Ghi nhận điều chuyển chuyên viên thụ lý vào Phiếu kiểm soát Mẫu 05 mà không làm gián đoạn đồng hồ SLA."
                          : "Hệ thống sẽ tự động cấp Giấy tiếp nhận & hẹn trả kết quả (Mẫu 01) và tính hạn SLA loại trừ Thứ Bảy, Chủ Nhật, Ngày lễ."}
                      </p>
                    </div>
                  )}

                  {selectedAction === "YEU_CAU_BO_SUNG" && (
                    <div className="space-y-2 p-3 bg-[#fff7ed] border border-[#fdba74]">
                      <label className="block font-bold text-[#9a3412]">
                        Nội dung hướng dẫn công dân bổ sung hồ sơ (Mẫu 02) *:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={supplementReason}
                        onChange={(e) => setSupplementReason(e.target.value)}
                        placeholder="Nêu đầy đủ, cụ thể một lần toàn bộ giấy tờ cần bổ sung hoặc kê khai lại..."
                        className="w-full border border-[#9ca3af] p-2 bg-white rounded-[2px]"
                      />
                      <p className="text-[11px] text-[#9a3412]">
                        Đồng hồ SLA sẽ tự động TẠM DỪNG trong thời gian chờ công dân nộp bổ sung.
                      </p>
                    </div>
                  )}

                  {selectedAction === "BO_SUNG_HO_SO" && (
                    <div className="space-y-2 p-3 bg-white border border-[#d6d3cd]">
                      <label className="block font-bold text-[#1e3a5f]">
                        Tên tệp / giấy tờ công dân giao nộp bổ sung:
                      </label>
                      <input
                        type="text"
                        value={newAttachmentName}
                        onChange={(e) => setNewAttachmentName(e.target.value)}
                        placeholder="VD: Giay_xac_nhan_tinh_trang_hon_nhan_bo_sung.pdf"
                        className="w-full border border-[#9ca3af] px-2.5 py-2 bg-white rounded-[2px]"
                      />
                      <p className="text-[11px] text-[#4b5563]">
                        Hệ thống sẽ cộng bù thời gian tạm dừng vào hạn trả kết quả SLA mới.
                      </p>
                    </div>
                  )}

                  {selectedAction === "TU_CHOI_TIEP_NHAN" && (
                    <div className="space-y-2.5 p-3 bg-[#fef2f2] border border-[#fca5a5]">
                      <div>
                        <label className="block font-bold text-[#991b1b] mb-1">
                          Lý do từ chối giải quyết hồ sơ (Mẫu 03) *:
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Ghi rõ lý do không thuộc thẩm quyền hoặc không đủ điều kiện pháp lý..."
                          className="w-full border border-[#9ca3af] p-2 bg-white rounded-[2px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#991b1b] mb-1">
                          Căn cứ pháp lý áp dụng *:
                        </label>
                        <input
                          type="text"
                          required
                          value={rejectionLegalBasis}
                          onChange={(e) => setRejectionLegalBasis(e.target.value)}
                          className="w-full border border-[#9ca3af] px-2.5 py-1.5 bg-white rounded-[2px]"
                        />
                      </div>
                    </div>
                  )}

                  {selectedAction === "TRINH_PHE_DUYET" && (
                    <div className="space-y-2 p-3 bg-white border border-[#d6d3cd]">
                      {mandatoryUnverified > 0 && (
                        <div className="p-2 bg-[#fef2f2] border border-[#dc2626] text-[#991b1b] font-semibold">
                          Còn {mandatoryUnverified} thành phần hồ sơ bắt buộc chưa tích đối chiếu ở Bảng 2 bên trái! Vui lòng tích đối chiếu trước khi trình ký.
                        </div>
                      )}
                      <label className="block font-bold text-[#1e3a5f]">
                        Ý kiến thẩm định chuyên môn & Đề xuất trình Lãnh đạo *:
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={appraisalNote}
                        onChange={(e) => setAppraisalNote(e.target.value)}
                        placeholder="Ví dụ: Đã kiểm tra đối chiếu bản chính và cơ sở dữ liệu chuyên ngành. Hồ sơ hợp lệ, đủ điều kiện trình Lãnh đạo UBND ký cấp kết quả..."
                        className="w-full border border-[#9ca3af] p-2 bg-white rounded-[2px]"
                      />
                    </div>
                  )}

                  {selectedAction === "PHE_DUYET_KET_QUA" && (
                    <div className="space-y-2.5 p-3 bg-[#f0fdf4] border border-[#86efac]">
                      <div>
                        <label className="block font-bold text-[#166534] mb-1">
                          Số ký hiệu Văn bản kết quả ban hành *:
                        </label>
                        <input
                          type="text"
                          required
                          value={resultDocNumber}
                          onChange={(e) => setResultDocNumber(e.target.value)}
                          placeholder="VD: 145/GXN-UBND"
                          className="w-full border border-[#9ca3af] px-2.5 py-1.5 bg-white rounded-[2px] font-semibold uppercase"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#166534] mb-1">
                          Trích yếu văn bản kết quả (tự động liên thông Sổ Văn bản đi) *:
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={resultSummary}
                          onChange={(e) => setResultSummary(e.target.value)}
                          className="w-full border border-[#9ca3af] p-2 bg-white rounded-[2px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#166534] mb-1">
                          Ý kiến bút phê của Lãnh đạo:
                        </label>
                        <input
                          type="text"
                          value={leaderNote}
                          onChange={(e) => setLeaderNote(e.target.value)}
                          placeholder="Đồng ý ký duyệt ban hành kết quả giải quyết TTHC."
                          className="w-full border border-[#9ca3af] px-2.5 py-1.5 bg-white rounded-[2px]"
                        />
                      </div>
                    </div>
                  )}

                  {selectedAction === "TRA_LAI_THAM_DINH" && (
                    <div className="space-y-2 p-3 bg-[#fffbeb] border border-[#f59e0b]">
                      <label className="block font-bold text-[#92400e]">
                        Ý kiến chỉ đạo yêu cầu Chuyên viên thẩm định lại *:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={leaderNote}
                        onChange={(e) => setLeaderNote(e.target.value)}
                        placeholder="Nêu rõ nội dung cần rà soát, xác minh lại..."
                        className="w-full border border-[#9ca3af] p-2 bg-white rounded-[2px]"
                      />
                    </div>
                  )}

                  {selectedAction === "GIA_HAN_XIN_LOI" && (
                    <div className="space-y-2.5 p-3 bg-[#fffbeb] border border-[#f59e0b]">
                      <div>
                        <label className="block font-bold text-[#92400e] mb-1">
                          Số ngày làm việc gia hạn thêm (tối đa 1 lần, 1–15 ngày) *:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={15}
                          required
                          value={extraWorkingDays}
                          onChange={(e) => setExtraWorkingDays(Number(e.target.value))}
                          className="w-full border border-[#9ca3af] px-2.5 py-1.5 bg-white rounded-[2px] tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#92400e] mb-1">
                          Lý do chậm trễ & Nội dung Phiếu xin lỗi công dân (Mẫu 04) *:
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={apologyReason}
                          onChange={(e) => setApologyReason(e.target.value)}
                          placeholder="Giải trình rõ nguyên nhân khách quan cần xác minh liên thông và xin lỗi công dân..."
                          className="w-full border border-[#9ca3af] p-2 bg-white rounded-[2px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Ghi chú chung */}
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">
                      Ghi chú luân chuyển đính kèm Nhật ký (tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ghi chú nội bộ hoặc thông tin bàn giao..."
                      className="w-full border border-[#9ca3af] px-2.5 py-2 bg-white rounded-[2px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-60 text-white font-bold uppercase tracking-wider rounded-[2px] cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {submitting ? "Đang ghi sổ & thực thi..." : "Xác nhận Thực thi Nghiệp vụ"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {printFormType && (
        <OfficialFormsPrintModal
          formType={printFormType}
          dossier={dossier}
          onClose={() => setPrintFormType(null)}
        />
      )}
    </div>
  );
}
