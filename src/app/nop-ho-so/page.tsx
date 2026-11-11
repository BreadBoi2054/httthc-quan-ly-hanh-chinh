"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { CulturalSubpageBanner } from "@/components/AdminEmblem";
import { CheckCircle2, FilePlus2, AlertCircle, Search, FolderArchive } from "lucide-react";

interface RequiredDoc {
  code: string;
  name: string;
  mandatory: boolean;
}

interface ProcedureOption {
  id: string;
  code: string;
  name: string;
  field: string;
  processingDays: number;
  processingHours?: number;
  feeAmount: number;
  feePerCopy?: boolean;
  feeExemptionNote?: string | null;
  requiredDocs: RequiredDoc[];
  department: { name: string };
}

interface VaultItem {
  id: string;
  sourceType: "KET_QUA_DIEN_TU" | "GIAY_TO_SO_HOA";
  code: string;
  title: string;
  fileName: string;
  issuedInfo: string;
}

interface AttachmentRowState {
  included: boolean;
  fileName: string;
  submittedType: "BAN_DIEN_TU" | "BAN_CHINH" | "BAN_SAO_CHUNG_THUC";
  reusedFromVault: boolean;
}

function SubmitDossierForm() {
  const searchParams = useSearchParams();
  const preselectedProcId = searchParams.get("procedureId") || "";

  const [procedures, setProcedures] = useState<ProcedureOption[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [procedureId, setProcedureId] = useState(preselectedProcId);
  const [applicantName, setApplicantName] = useState("");
  const [applicantCitizenId, setApplicantCitizenId] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [applicantBirthYear, setApplicantBirthYear] = useState("1992");
  const [hasAuthorization, setHasAuthorization] = useState(false);
  const [representativeName, setRepresentativeName] = useState("");
  const [representativeCitizenId, setRepresentativeCitizenId] = useState("");
  const [authorizationNote, setAuthorizationNote] = useState("");
  const [summary, setSummary] = useState("");
  const [copiesCount, setCopiesCount] = useState(1);
  const [feeExempt, setFeeExempt] = useState(false);
  const [feeExemptReason, setFeeExemptReason] = useState("");

  const [attachmentState, setAttachmentState] = useState<Record<string, AttachmentRowState>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdResult, setCreatedResult] = useState<{
    dossierCode: string;
    trackingPin: string;
    procedureName: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/procedures").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([procData, authData]) => {
      const list: ProcedureOption[] = procData.procedures || [];
      setProcedures(list);
      const targetId = preselectedProcId || (list[0]?.id ?? "");
      if (targetId) {
        setProcedureId(targetId);
        const found = list.find((p) => p.id === targetId);
        if (found) initAttachmentMap(found);
      }

      if (authData.authenticated && authData.user) {
        setApplicantName(authData.user.fullName || "");
        setApplicantCitizenId(authData.user.citizenId || "");
        setApplicantPhone(authData.user.phone || "");
        setApplicantEmail(authData.user.email || "");
        setApplicantAddress(authData.user.address || "");

        fetch("/api/dossiers?vault=1")
          .then((r) => r.json())
          .then((vData) => {
            if (Array.isArray(vData?.vaultItems)) {
              setVaultItems(vData.vaultItems);
            }
          })
          .catch(() => {});
      }
    });
  }, [preselectedProcId]);

  function initAttachmentMap(proc: ProcedureOption) {
    const nextMap: Record<string, AttachmentRowState> = {};
    for (const doc of proc.requiredDocs) {
      nextMap[doc.code] = {
        included: doc.mandatory,
        fileName: `${doc.code}_DinhKemDienTu.pdf`,
        submittedType: "BAN_DIEN_TU",
        reusedFromVault: false,
      };
    }
    setAttachmentState(nextMap);
  }

  const selectedProc = procedures.find((p) => p.id === procedureId);

  function handleProcedureChange(nextId: string) {
    setProcedureId(nextId);
    const found = procedures.find((p) => p.id === nextId);
    if (found) initAttachmentMap(found);
  }

  function applyVaultItemToDoc(docCode: string, item: VaultItem) {
    setAttachmentState((prev) => ({
      ...prev,
      [docCode]: {
        included: true,
        fileName: item.fileName,
        submittedType: "BAN_DIEN_TU",
        reusedFromVault: true,
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProc) return;
    setError("");
    setSubmitting(true);

    try {
      const attachmentsPayload = selectedProc.requiredDocs
        .filter((doc) => attachmentState[doc.code]?.included)
        .map((doc) => ({
          docCode: doc.code,
          docName: doc.name,
          isMandatory: doc.mandatory,
          submittedType: attachmentState[doc.code]?.submittedType || "BAN_DIEN_TU",
          quantity: 1,
          fileName: attachmentState[doc.code]?.fileName || `${doc.code}.pdf`,
          reusedFromVault: Boolean(attachmentState[doc.code]?.reusedFromVault),
        }));

      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureId,
          applicantName,
          applicantCitizenId,
          applicantPhone,
          applicantEmail,
          applicantAddress,
          applicantBirthYear: applicantBirthYear ? Number(applicantBirthYear) : undefined,
          hasAuthorization,
          representativeName,
          representativeCitizenId,
          authorizationNote,
          channel: "TRUC_TUYEN",
          summary,
          copiesCount,
          feeExempt,
          feeExemptReason,
          attachments: attachmentsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể gửi hồ sơ trực tuyến.");
        setSubmitting(false);
        return;
      }

      setCreatedResult({
        dossierCode: data.trackingInfo.dossierCode,
        trackingPin: data.trackingInfo.trackingPin,
        procedureName: selectedProc.name,
      });
      setSubmitting(false);
    } catch {
      setError("Lỗi kết nối khi gửi hồ sơ trực tuyến.");
      setSubmitting(false);
    }
  }

  if (createdResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border-2 border-[#15803d] p-6 sm:p-8 rounded-[2px] space-y-5">
          <div className="flex items-start gap-3 border-b border-[#e5e7eb] pb-4">
            <CheckCircle2 className="w-8 h-8 text-[#15803d] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase text-[#15803d]">
                GỬI HỒ SƠ DỊCH VỤ CÔNG TRỰC TUYẾN THÀNH CÔNG
              </p>
              <h1 className="text-xl font-bold text-[#111827] font-official-serif mt-0.5">
                Hệ thống đã ghi nhận hồ sơ vào Hàng đợi Tiếp nhận Một cửa
              </h1>
            </div>
          </div>

          <div className="bg-[#fffdf5] border border-[#d6d3cd] p-4 rounded-[2px] grid grid-cols-1 sm:grid-cols-2 gap-4 tabular-nums">
            <div>
              <p className="text-xs text-[#4b5563]">Mã số biên nhận hồ sơ</p>
              <p className="text-xl font-bold text-[#991b1b] mt-0.5">{createdResult.dossierCode}</p>
            </div>
            <div>
              <p className="text-xs text-[#4b5563]">Mã PIN bảo mật tra cứu &amp; in phiếu</p>
              <p className="text-xl font-bold text-[#991b1b] mt-0.5">{createdResult.trackingPin}</p>
            </div>
            <div className="sm:col-span-2 text-xs text-[#374151]">
              Thủ tục đăng ký: <strong>{createdResult.procedureName}</strong>. Vui lòng lưu lại <strong>Mã số hồ sơ</strong> và <strong>Mã PIN bảo mật</strong> để tra cứu tiến độ, nộp lệ phí trực tuyến hoặc tải kết quả điện tử.
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/tra-cuu?code=${createdResult.dossierCode}&pin=${createdResult.trackingPin}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-[2px]"
            >
              <Search className="w-4 h-4" />
              Xem chi tiết &amp; Trạng thái hồ sơ vừa nộp
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreatedResult(null);
                setSummary("");
              }}
              className="px-4 py-2.5 text-sm font-semibold border border-[#9ca3af] hover:bg-[#f9fafb] rounded-[2px] cursor-pointer"
            >
              Nộp thêm hồ sơ khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  const estimatedFee = selectedProc
    ? feeExempt || selectedProc.feeAmount === 0
      ? 0
      : selectedProc.feePerCopy
      ? selectedProc.feeAmount * copiesCount
      : selectedProc.feeAmount
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <CulturalSubpageBanner
        eyebrow="TIẾP NHẬN HỒ SƠ ĐIỆN TỬ • UBND PHƯỜNG THANH NHÀN"
        title="Nộp Hồ sơ Dịch vụ Hành chính Công Trực tuyến"
        description="Kê khai chính xác thông tin định danh và đính kèm đầy đủ thành phần hồ sơ bắt buộc theo quy định pháp luật."
      />

      {error && (
        <div
          role="alert"
          className="p-4 bg-[#fef2f2] border-l-4 border-[#dc2626] text-sm text-[#991b1b] flex items-start gap-2.5 rounded-[2px]"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Khối 1: Chọn Thủ tục hành chính */}
        <div className="bg-white border border-[#d6d3cd] p-5 rounded-[2px] space-y-4">
          <h2 className="text-sm font-bold uppercase text-[#991b1b] border-b border-[#e5e7eb] pb-2">
            I. Chọn Thủ tục Hành chính đề nghị giải quyết
          </h2>

          <div>
            <label htmlFor="procedureId" className="block text-xs font-semibold text-[#111827] mb-1">
              Thủ tục hành chính <span className="text-[#b91c1c]">*</span>
            </label>
            <select
              id="procedureId"
              required
              value={procedureId}
              onChange={(e) => handleProcedureChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#9ca3af] rounded-[2px] bg-white focus:outline-none focus:border-[#991b1b]"
            >
              {procedures.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name} ({p.field})
                </option>
              ))}
            </select>
          </div>

          {selectedProc && (
            <div className="bg-[#fffdf5] border border-[#e5e7eb] p-3.5 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
              <div>
                <span className="text-[#4b5563] block">Cơ quan chuyên môn thụ lý:</span>
                <strong className="text-[#111827]">{selectedProc.department.name}</strong>
              </div>
              <div>
                <span className="text-[#4b5563] block">Thời hạn giải quyết quy định:</span>
                <strong className="text-[#991b1b]">
                  {selectedProc.processingDays === 0
                    ? `Giải quyết trong ngày (${selectedProc.processingHours || 4}h làm việc)`
                    : `${selectedProc.processingDays} ngày làm việc`}
                </strong>
              </div>
              <div>
                <span className="text-[#4b5563] block">Lệ phí tạm tính:</span>
                <strong className="text-[#15803d]">
                  {estimatedFee === 0
                    ? "Miễn lệ phí (0 đồng)"
                    : `${estimatedFee.toLocaleString("vi-VN")} đồng${selectedProc.feePerCopy ? ` (${copiesCount} bản)` : ""}`}
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* Khối 2: Thông tin Chủ hồ sơ & Ủy quyền */}
        <div className="bg-white border border-[#d6d3cd] p-5 rounded-[2px] space-y-4">
          <h2 className="text-sm font-bold uppercase text-[#991b1b] border-b border-[#e5e7eb] pb-2">
            II. Thông tin Cá nhân / Tổ chức đứng tên hồ sơ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5">
              <label htmlFor="applicantName" className="block text-xs font-semibold text-[#111827] mb-1">
                Họ và tên người yêu cầu <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                id="applicantName"
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px]"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="applicantCitizenId" className="block text-xs font-semibold text-[#111827] mb-1">
                Số CCCD (12 chữ số) / Mã số thuế <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                id="applicantCitizenId"
                type="text"
                inputMode="numeric"
                required
                value={applicantCitizenId}
                onChange={(e) => setApplicantCitizenId(e.target.value)}
                placeholder="079092004518"
                className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] tabular-nums"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="applicantBirthYear" className="block text-xs font-semibold text-[#111827] mb-1">
                Năm sinh
              </label>
              <input
                id="applicantBirthYear"
                type="number"
                value={applicantBirthYear}
                onChange={(e) => setApplicantBirthYear(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] tabular-nums"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="applicantPhone" className="block text-xs font-semibold text-[#111827] mb-1">
                Số điện thoại nhận thông báo <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                id="applicantPhone"
                type="text"
                inputMode="numeric"
                required
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                placeholder="0938123456"
                className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] tabular-nums"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="applicantEmail" className="block text-xs font-semibold text-[#111827] mb-1">
                Thư điện tử (nhận kết quả điện tử)
              </label>
              <input
                id="applicantEmail"
                type="email"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                placeholder="congdan@noibo.vn"
                className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px]"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="copiesCount" className="block text-xs font-semibold text-[#111827] mb-1">
                Số lượng bản kết quả đăng ký nhận
              </label>
              <input
                id="copiesCount"
                type="number"
                min={1}
                max={50}
                value={copiesCount}
                onChange={(e) => setCopiesCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] tabular-nums"
              />
            </div>

            <div className="sm:col-span-12">
              <label htmlFor="applicantAddress" className="block text-xs font-semibold text-[#111827] mb-1">
                Địa chỉ thường trú / Trụ sở hiện tại <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                id="applicantAddress"
                type="text"
                required
                value={applicantAddress}
                onChange={(e) => setApplicantAddress(e.target.value)}
                placeholder="Số nhà, đường, khu phố, phường..."
                className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px]"
              />
            </div>
          </div>

          {/* Tùy chọn Ủy quyền nộp thay */}
          <div className="pt-2 border-t border-[#f3f4f6] space-y-3">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#991b1b] cursor-pointer">
              <input
                type="checkbox"
                checked={hasAuthorization}
                onChange={(e) => setHasAuthorization(e.target.checked)}
                className="w-4 h-4 accent-[#991b1b]"
              />
              Nộp hồ sơ thông qua Người được ủy quyền hợp pháp / Người đại diện
            </label>

            {hasAuthorization && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#fffdf5] p-3.5 border border-[#d6d3cd] rounded-[2px]">
                <div>
                  <label className="block text-xs font-semibold mb-1">Họ tên người được ủy quyền *</label>
                  <input
                    type="text"
                    required={hasAuthorization}
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-[#9ca3af] bg-white rounded-[2px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Số CCCD người được ủy quyền *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required={hasAuthorization}
                    value={representativeCitizenId}
                    onChange={(e) => setRepresentativeCitizenId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-[#9ca3af] bg-white rounded-[2px] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Số/Ngày Giấy ủy quyền chứng thực *</label>
                  <input
                    type="text"
                    required={hasAuthorization}
                    value={authorizationNote}
                    onChange={(e) => setAuthorizationNote(e.target.value)}
                    placeholder="VD: GUQ số 45/2026 ngày 10/11/2026"
                    className="w-full px-2.5 py-1.5 text-sm border border-[#9ca3af] bg-white rounded-[2px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tùy chọn đề nghị Miễn lệ phí theo chính sách */}
          {selectedProc && selectedProc.feeAmount > 0 && (
            <div className="pt-2 border-t border-[#f3f4f6] space-y-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#991b1b] cursor-pointer">
                <input
                  type="checkbox"
                  checked={feeExempt}
                  onChange={(e) => setFeeExempt(e.target.checked)}
                  className="w-4 h-4 accent-[#991b1b]"
                />
                Thuộc đối tượng được miễn lệ phí theo quy định ({selectedProc.feeExemptionNote})
              </label>
              {feeExempt && (
                <input
                  type="text"
                  required
                  value={feeExemptReason}
                  onChange={(e) => setFeeExemptReason(e.target.value)}
                  placeholder="Ghi rõ căn cứ miễn phí (VD: Hộ nghèo theo Giấy chứng nhận số... / Người có công)"
                  className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px]"
                />
              )}
            </div>
          )}

          <div>
            <label htmlFor="summary" className="block text-xs font-semibold text-[#111827] mb-1">
              Trích yếu nội dung đề nghị giải quyết cụ thể <span className="text-[#b91c1c]">*</span>
            </label>
            <textarea
              id="summary"
              rows={3}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ghi rõ mục đích sử dụng giấy tờ, thửa đất hoặc nội dung đề nghị cơ quan hành chính giải quyết..."
              className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px]"
            />
          </div>
        </div>

        {/* Khối 3: Danh mục Thành phần hồ sơ đính kèm + Kho dữ liệu điện tử cá nhân */}
        {selectedProc && (
          <div className="bg-white border border-[#d6d3cd] p-5 rounded-[2px] space-y-4">
            <div className="border-b border-[#e5e7eb] pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-sm font-bold uppercase text-[#991b1b]">
                III. Thành phần Hồ sơ Đính kèm theo Danh mục Công bố
              </h2>
              {vaultItems.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803d] bg-[#f0fdf4] px-2.5 py-1 border border-[#86efac] rounded-[2px]">
                  <FolderArchive className="w-3.5 h-3.5" />
                  Kho dữ liệu điện tử cá nhân: {vaultItems.length} tài liệu đã số hóa (NĐ 45/2020/NĐ-CP)
                </span>
              )}
            </div>

            {vaultItems.length > 0 && (
              <div className="p-3 bg-[#fffdf5] border border-[#d6d3cd] rounded-[2px] text-xs space-y-2">
                <p className="font-semibold text-[#111827]">
                  Tái sử dụng giấy tờ, kết quả điện tử đã được cơ quan nhà nước số hóa (không phải nộp lại bản sao):
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {vaultItems.slice(0, 4).map((item) => {
                    const matchedDoc =
                      selectedProc.requiredDocs.find((d) => d.code === item.code) ||
                      selectedProc.requiredDocs[0];
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 bg-white border border-[#d6d3cd] rounded-[2px] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[#991b1b] truncate">{item.title}</p>
                          <p className="text-[11px] text-[#4b5563] truncate">{item.issuedInfo}</p>
                        </div>
                        {matchedDoc && (
                          <button
                            type="button"
                            onClick={() => applyVaultItemToDoc(matchedDoc.code, item)}
                            className="shrink-0 px-2.5 py-1 text-[11px] font-bold bg-[#15803d] hover:bg-[#166534] text-white rounded-[2px] cursor-pointer"
                          >
                            Đính kèm [{matchedDoc.code}]
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-[#d6d3cd] border-collapse">
                <thead>
                  <tr className="bg-[#fffdf5] text-left">
                    <th className="border border-[#d6d3cd] px-3 py-2 w-12 text-center">Nộp</th>
                    <th className="border border-[#d6d3cd] px-3 py-2">Tên giấy tờ, thành phần hồ sơ</th>
                    <th className="border border-[#d6d3cd] px-3 py-2 w-24 text-center">Quy định</th>
                    <th className="border border-[#d6d3cd] px-3 py-2 w-44">Hình thức bản nộp</th>
                    <th className="border border-[#d6d3cd] px-3 py-2 w-64">Tệp điện tử / Kho số hóa</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProc.requiredDocs.map((doc) => {
                    const row = attachmentState[doc.code] || {
                      included: doc.mandatory,
                      fileName: `${doc.code}.pdf`,
                      submittedType: "BAN_DIEN_TU" as const,
                      reusedFromVault: false,
                    };
                    return (
                      <tr key={doc.code}>
                        <td className="border border-[#d6d3cd] px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.included}
                            aria-label={`Đính kèm ${doc.name}`}
                            onChange={(e) =>
                              setAttachmentState((prev) => ({
                                ...prev,
                                [doc.code]: { ...row, included: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 accent-[#991b1b]"
                          />
                        </td>
                        <td className="border border-[#d6d3cd] px-3 py-2 font-medium text-[#111827]">
                          <span>{doc.name}</span>
                          {row.reusedFromVault && (
                            <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-bold bg-[#dcfce7] text-[#166534] border border-[#86efac] rounded-[2px]">
                              Tái sử dụng Kho dữ liệu số
                            </span>
                          )}
                        </td>
                        <td className="border border-[#d6d3cd] px-3 py-2 text-center">
                          {doc.mandatory ? (
                            <span className="text-[#991b1b] font-bold">Bắt buộc</span>
                          ) : (
                            <span className="text-[#4b5563]">Tùy chọn</span>
                          )}
                        </td>
                        <td className="border border-[#d6d3cd] px-2 py-1.5">
                          <select
                            value={row.submittedType}
                            disabled={!row.included}
                            aria-label={`Hình thức nộp ${doc.code}`}
                            onChange={(e) =>
                              setAttachmentState((prev) => ({
                                ...prev,
                                [doc.code]: {
                                  ...row,
                                  submittedType: e.target.value as
                                    | "BAN_DIEN_TU"
                                    | "BAN_CHINH"
                                    | "BAN_SAO_CHUNG_THUC",
                                },
                              }))
                            }
                            className="w-full px-2 py-1 border border-[#9ca3af] bg-white rounded-[2px]"
                          >
                            <option value="BAN_DIEN_TU">Bản điện tử ký số / PDF</option>
                            <option value="BAN_SAO_CHUNG_THUC">Bản sao chứng thực</option>
                            <option value="BAN_CHINH">Bản chính đối chiếu</option>
                          </select>
                        </td>
                        <td className="border border-[#d6d3cd] px-2 py-1.5 space-y-1">
                          <input
                            type="text"
                            disabled={!row.included}
                            value={row.fileName}
                            aria-label={`Tên tệp ${doc.code}`}
                            onChange={(e) =>
                              setAttachmentState((prev) => ({
                                ...prev,
                                [doc.code]: {
                                  ...row,
                                  fileName: e.target.value,
                                  reusedFromVault: false,
                                },
                              }))
                            }
                            className="w-full px-2 py-1 border border-[#9ca3af] bg-white rounded-[2px]"
                          />
                          {vaultItems.length > 0 && row.included && (
                            <select
                              value=""
                              aria-label={`Chọn từ Kho dữ liệu số cho ${doc.code}`}
                              onChange={(e) => {
                                const picked = vaultItems.find((v) => v.id === e.target.value);
                                if (picked) applyVaultItemToDoc(doc.code, picked);
                              }}
                              className="w-full px-1.5 py-1 text-[11px] border border-[#86efac] bg-[#f0fdf4] text-[#166534] font-semibold rounded-[2px]"
                            >
                              <option value="">+ Chọn từ Kho dữ liệu điện tử cá nhân...</option>
                              {vaultItems.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.fileName} — {v.title}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/thu-tuc"
            className="px-4 py-2.5 text-sm font-medium border border-[#9ca3af] bg-white hover:bg-[#f9fafb] rounded-[2px]"
          >
            Quay lại Danh mục
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-60 text-white rounded-[2px] cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            {submitting ? "Đang kiểm tra & gửi hồ sơ..." : "Cam kết đúng sự thật & Nộp hồ sơ"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SubmitDossierPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center text-sm">Đang khởi tạo biểu mẫu điện tử...</div>}>
          <SubmitDossierForm />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
