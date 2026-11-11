"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { DossierStatusBadge, FeeBadge, SlaBadge } from "@/components/StatusBadges";
import { FormTemplateType, OfficialFormsPrintModal } from "@/components/OfficialFormsPrint";
import { Search, Printer, Lock, Unlock, Star, CreditCard, Upload, XCircle } from "lucide-react";

function TrackDossierContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const initialPin = searchParams.get("pin") || "";

  const [code, setCode] = useState(initialCode);
  const [pin, setPin] = useState(initialPin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<{ pinVerified: boolean; dossier: any } | null>(null);
  const [printForm, setPrintForm] = useState<FormTemplateType | null>(null);

  // Thao tác trực tuyến bằng PIN (Nộp bổ sung / Thanh toán phí / Rút hồ sơ)
  const [supplementFile, setSupplementFile] = useState("BoSung_HoSo_TrucTuyen.pdf");
  const [pinActionFeedback, setPinActionFeedback] = useState("");
  const [pinActionError, setPinActionError] = useState("");
  const [pinActionBusy, setPinActionBusy] = useState(false);
  const [confirmPinWithdraw, setConfirmPinWithdraw] = useState(false);

  // Đánh giá hài lòng SIPAS
  const [rating, setRating] = useState<"RAT_HAI_LONG" | "HAI_LONG" | "BINH_THUONG" | "CHUA_HAI_LONG">("RAT_HAI_LONG");
  const [ratingComment, setRatingComment] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingError, setRatingError] = useState("");

  const fetchTrack = useCallback(async (targetCode: string, targetPin: string) => {
    if (!targetCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ code: targetCode.trim().toUpperCase() });
      if (targetPin.trim()) qs.set("pin", targetPin.trim());
      const res = await fetch(`/api/public/track?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không tìm thấy hồ sơ");
        setResult(null);
      } else {
        setResult(data);
      }
    } catch {
      setError("Lỗi kết nối máy chủ tra cứu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCode) {
      fetchTrack(initialCode, initialPin);
    }
  }, [initialCode, initialPin, fetchTrack]);

  async function handleRateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!result?.dossier) return;
    setRatingMessage("");
    setRatingError("");
    try {
      const res = await fetch("/api/public/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierCode: result.dossier.dossierCode,
          trackingPin: pin,
          rating,
          comment: ratingComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRatingError(data.error || "Không thể gửi đánh giá.");
      } else {
        setRatingMessage("Cảm ơn ông/bà đã gửi đánh giá mức độ hài lòng (Chỉ số SIPAS)!");
        fetchTrack(code || result.dossier.dossierCode, pin);
      }
    } catch {
      setRatingError("Lỗi kết nối máy chủ khi gửi khảo sát hài lòng.");
    }
  }

  async function handlePinCitizenAction(
    action: "THU_LE_PHI" | "BO_SUNG_HO_SO" | "RUT_HO_SO"
  ) {
    if (!result?.dossier) return;
    setPinActionBusy(true);
    setPinActionError("");
    setPinActionFeedback("");
    try {
      const res = await fetch("/api/public/track", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierCode: result.dossier.dossierCode,
          trackingPin: pin,
          action,
          newAttachmentName:
            action === "BO_SUNG_HO_SO" ? supplementFile : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinActionError(data.error || "Không thể thực hiện thao tác.");
      } else {
        setPinActionFeedback(data.message || "Cập nhật hồ sơ thành công!");
        setConfirmPinWithdraw(false);
        await fetchTrack(code || result.dossier.dossierCode, pin);
      }
    } catch {
      setPinActionError("Lỗi kết nối máy chủ khi thực hiện thao tác.");
    } finally {
      setPinActionBusy(false);
    }
  }

  const d = result?.dossier;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="border-b-2 border-[#991b1b] pb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-[#991b1b] uppercase font-official-serif">
          Tra cứu Tiến độ Giải quyết Hồ sơ &amp; Biểu mẫu Điện tử
        </h1>
        <p className="text-sm text-[#4b5563] mt-1">
          Bảo vệ dữ liệu cá nhân: Tra cứu bằng Mã biên nhận hiển thị tiến độ chung; nhập thêm Mã PIN 6 số trên Giấy hẹn để mở khóa toàn bộ biểu mẫu in ấn và đánh giá hài lòng.
        </p>
      </div>

      {/* Form nhập tra cứu */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchTrack(code, pin);
        }}
        className="bg-white border border-[#d6d3cd] p-5 rounded-[2px] grid grid-cols-1 sm:grid-cols-12 gap-3"
      >
        <div className="sm:col-span-5">
          <label htmlFor="track-code" className="block text-xs font-semibold mb-1">
            Mã số biên nhận hồ sơ *
          </label>
          <input
            id="track-code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HS-20261110-0005"
            className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] tabular-nums"
          />
        </div>

        <div className="sm:col-span-4">
          <label htmlFor="track-pin" className="block text-xs font-semibold mb-1">
            Mã PIN bảo mật trên Giấy hẹn (6 số)
          </label>
          <input
            id="track-pin"
            type="text"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Nhập PIN để xem đầy đủ & in phiếu"
            className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] tabular-nums"
          />
        </div>

        <div className="sm:col-span-3 flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-[2px] cursor-pointer"
          >
            <Search className="w-4 h-4" />
            {loading ? "Đang tra cứu..." : "Tra cứu hồ sơ"}
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="bg-[#fef2f2] border border-[#dc2626] p-4 text-sm text-[#991b1b] rounded-[2px]"
        >
          {error}
        </div>
      )}

      {d && (
        <div className="bg-white border border-[#d6d3cd] rounded-[2px] overflow-hidden">
          <div className="bg-[#faf8f5] px-5 py-4 border-b border-[#d6d3cd] flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base font-bold text-[#991b1b] tabular-nums">{d.dossierCode}</span>
                <DossierStatusBadge status={d.status} />
                <SlaBadge state={d.sla.state} label={d.sla.label} />
              </div>
              <p className="text-sm font-semibold text-[#111827] mt-1">
                [{d.procedure.code}] {d.procedure.name}
              </p>
            </div>

            <div className="text-xs">
              {result.pinVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#dcfce7] text-[#166534] border border-[#86efac] rounded-[2px] font-semibold">
                  <Unlock className="w-3.5 h-3.5" />
                  Đã xác thực Mã PIN • Mở khóa biểu mẫu
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fef3c7] text-[#92400e] border border-[#fcd34d] rounded-[2px] font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  Chế độ ẩn dữ liệu cá nhân (Nhập Mã PIN để in phiếu)
                </span>
              )}
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-b border-[#e5e7eb] tabular-nums">
            <div>
              <span className="text-xs text-[#4b5563] block">Chủ hồ sơ đăng ký</span>
              <strong>{result.pinVerified ? d.applicantName : d.applicantNameMasked}</strong> (
              {result.pinVerified ? d.applicantCitizenId : d.applicantCitizenIdMasked})
            </div>
            <div>
              <span className="text-xs text-[#4b5563] block">Bộ phận chuyên môn giải quyết</span>
              <strong>{d.department.name}</strong> ({d.department.roomNumber})
            </div>
            <div>
              <span className="text-xs text-[#4b5563] block">Thời điểm gửi / tiếp nhận</span>
              <span>
                Nộp: {new Date(d.submittedAt).toLocaleString("vi-VN")}
                {d.acceptedAt ? ` • Tiếp nhận: ${new Date(d.acceptedAt).toLocaleString("vi-VN")}` : ""}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#4b5563] block">Hạn trả kết quả theo quy định</span>
              <strong className="text-[#991b1b]">
                {d.dueAt ? new Date(d.dueAt).toLocaleString("vi-VN") : "Chờ Bộ phận Một cửa tiếp nhận"}
              </strong>
            </div>
            <div>
              <span className="text-xs text-[#4b5563] block">Tình trạng nghĩa vụ lệ phí</span>
              <FeeBadge status={d.feeStatus} amount={d.feeAmount} />
            </div>
            {d.resultDocNumber && (
              <div>
                <span className="text-xs text-[#4b5563] block">Văn bản / Giấy phép kết quả ban hành</span>
                <strong className="text-[#15803d]">{d.resultDocNumber}</strong>
                {result.pinVerified && d.isDigitizedResult && d.electronicResultCode && (
                  <span className="block text-xs font-semibold text-[#166534] mt-0.5">
                    Mã kết quả điện tử (Kho số hóa): {d.electronicResultCode}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Nếu đã xác thực PIN: Cho phép in các biểu mẫu hành chính A4 phát sinh */}
          {result.pinVerified && (
            <div className="px-5 py-4 bg-[#faf8f5] border-b border-[#e5e7eb] flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold uppercase text-[#1e3a5f]">Biểu mẫu hành chính điện tử:</span>
              {d.acceptedAt && (
                <button
                  type="button"
                  onClick={() => setPrintForm("MAU_01")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#e0f2fe] rounded-[2px] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Mẫu 01: Giấy tiếp nhận &amp; hẹn trả
                </button>
              )}
              <button
                type="button"
                onClick={() => setPrintForm("MAU_05")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#374151] text-[#111827] hover:bg-[#f3f4f6] rounded-[2px] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Mẫu 05: Phiếu kiểm soát quy trình
              </button>
              {d.supplementReason && (
                <button
                  type="button"
                  onClick={() => setPrintForm("MAU_02")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#ea580c] text-[#9a3412] hover:bg-[#ffedd5] rounded-[2px] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Mẫu 02: Phiếu yêu cầu bổ sung
                </button>
              )}
              {d.rejectionReason && (
                <button
                  type="button"
                  onClick={() => setPrintForm("MAU_03")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#dc2626] text-[#991b1b] hover:bg-[#fee2e2] rounded-[2px] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Mẫu 03: Phiếu từ chối tiếp nhận
                </button>
              )}
              {d.apologyFormCode && (
                <button
                  type="button"
                  onClick={() => setPrintForm("MAU_04")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#b45309] text-[#92400e] hover:bg-[#fef3c7] rounded-[2px] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Mẫu 04: Phiếu xin lỗi &amp; hẹn lại ngày trả
                </button>
              )}
              {d.feeStatus === "DA_THU_PHI" && (
                <button
                  type="button"
                  onClick={() => setPrintForm("BIEN_LAI")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#15803d] text-[#15803d] hover:bg-[#dcfce7] rounded-[2px] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Biên lai thu lệ phí ({d.receiptNumber})
                </button>
              )}
            </div>
          )}

          {/* Bàn Tác nghiệp Công dân trực tuyến bằng Mã PIN (Thanh toán phí / Bổ sung / Rút hồ sơ) */}
          {result.pinVerified &&
            (d.status === "YEU_CAU_BO_SUNG" ||
              (d.feeStatus === "CHUA_THU_PHI" &&
                !d.feeExempt &&
                d.feeAmount > 0 &&
                ["DA_TIEP_NHAN", "DANG_THAM_DINH", "CHO_PHE_DUYET", "CHO_TRA_KET_QUA"].includes(d.status)) ||
              ["MOI_NOP", "DA_TIEP_NHAN", "YEU_CAU_BO_SUNG", "DANG_THAM_DINH"].includes(d.status)) && (
              <div className="px-5 py-4 bg-[#fefce8] border-b border-[#e5e7eb] space-y-3 text-xs">
                <p className="font-bold uppercase text-[#78350f]">
                  Tác nghiệp Trực tuyến của Chủ hồ sơ (Đã xác thực Mã PIN):
                </p>
                {pinActionFeedback && (
                  <div
                    role="status"
                    className="p-2.5 bg-[#dcfce7] border border-[#16a34a] text-[#166534] font-semibold rounded-[2px]"
                  >
                    {pinActionFeedback}
                  </div>
                )}
                {pinActionError && (
                  <div
                    role="alert"
                    className="p-2.5 bg-[#fef2f2] border border-[#dc2626] text-[#991b1b] font-semibold rounded-[2px]"
                  >
                    {pinActionError}
                  </div>
                )}

                {d.status === "YEU_CAU_BO_SUNG" && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={supplementFile}
                      onChange={(e) => setSupplementFile(e.target.value)}
                      placeholder="Tên tệp bổ sung số hóa..."
                      className="flex-1 px-3 py-1.5 border border-[#9ca3af] bg-white rounded-[2px]"
                    />
                    <button
                      type="button"
                      disabled={pinActionBusy}
                      onClick={() => handlePinCitizenAction("BO_SUNG_HO_SO")}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-[2px] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Gửi hồ sơ bổ sung (Mẫu 02)
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2.5">
                  {d.feeStatus === "CHUA_THU_PHI" &&
                    !d.feeExempt &&
                    d.feeAmount > 0 &&
                    ["DA_TIEP_NHAN", "DANG_THAM_DINH", "CHO_PHE_DUYET", "CHO_TRA_KET_QUA"].includes(
                      d.status
                    ) && (
                      <button
                        type="button"
                        disabled={pinActionBusy}
                        onClick={() => handlePinCitizenAction("THU_LE_PHI")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white font-bold rounded-[2px] cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Thanh toán Lệ phí Trực tuyến ({d.feeAmount.toLocaleString("vi-VN")} đ)
                      </button>
                    )}

                  {["MOI_NOP", "DA_TIEP_NHAN", "YEU_CAU_BO_SUNG", "DANG_THAM_DINH"].includes(
                    d.status
                  ) &&
                    (confirmPinWithdraw ? (
                      <div className="inline-flex items-center gap-1.5 bg-[#fef2f2] border border-[#dc2626] px-2.5 py-1 rounded-[2px]">
                        <span className="text-[#991b1b] font-semibold">Xác nhận rút hồ sơ này?</span>
                        <button
                          type="button"
                          disabled={pinActionBusy}
                          onClick={() => handlePinCitizenAction("RUT_HO_SO")}
                          className="px-2.5 py-1 bg-[#991b1b] text-white font-bold rounded-[2px] cursor-pointer"
                        >
                          Đồng ý rút
                        </button>
                        <button
                          type="button"
                          disabled={pinActionBusy}
                          onClick={() => setConfirmPinWithdraw(false)}
                          className="px-2.5 py-1 bg-white border border-[#9ca3af] text-[#111827] font-medium rounded-[2px] cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={pinActionBusy}
                        onClick={() => setConfirmPinWithdraw(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#dc2626] text-[#991b1b] hover:bg-[#fef2f2] font-semibold rounded-[2px] cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Đề nghị Rút hồ sơ
                      </button>
                    ))}
                </div>
              </div>
            )}

          {/* Nhật ký kiểm soát quá trình giải quyết hồ sơ (Mẫu 05) */}
          <div className="p-5">
            <h3 className="text-xs font-bold uppercase text-[#991b1b] mb-3">
              Phiếu kiểm soát quá trình giải quyết hồ sơ (Lưu vết thời gian thực)
            </h3>
            <ol className="relative border-l-2 border-[#991b1b]/40 ml-2 space-y-4">
              {d.histories.map(
                (h: {
                  id: string;
                  actionName: string;
                  actorName?: string;
                  actorRole: string;
                  note?: string;
                  createdAt: string;
                }) => (
                  <li key={h.id} className="ml-4">
                    <div className="absolute w-2.5 h-2.5 bg-[#991b1b] rounded-full -left-[6px] mt-1.5" />
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-[#111827]">{h.actionName}</span>
                      <span className="text-[#4b5563] tabular-nums">
                        • {new Date(h.createdAt).toLocaleString("vi-VN")}
                      </span>
                      <span className="bg-[#f3f4f6] text-[#374151] px-1.5 py-0.5 rounded-[2px]">
                        {h.actorName ? `${h.actorName} (${h.actorRole})` : h.actorRole}
                      </span>
                    </div>
                    {h.note && <p className="text-xs text-[#374151] mt-1">{h.note}</p>}
                  </li>
                )
              )}
            </ol>
          </div>

          {/* Đánh giá sự hài lòng SIPAS khi hồ sơ đã HOAN_THANH và đã nhập đúng PIN */}
          {result.pinVerified && d.status === "HOAN_THANH" && (
            <div className="p-5 bg-[#faf8f5] border-t border-[#d6d3cd]">
              <h3 className="text-sm font-bold text-[#1e3a5f] flex items-center gap-1.5">
                <Star className="w-4 h-4 text-[#d97706]" />
                Khảo sát Mức độ Hài lòng của Người dân (Chỉ số SIPAS)
              </h3>
              {d.satisfactionRating ? (
                <p className="text-xs text-[#15803d] font-semibold mt-1.5">
                  Hồ sơ này đã được ghi nhận đánh giá:{" "}
                  {d.satisfactionRating === "RAT_HAI_LONG"
                    ? "Rất hài lòng"
                    : d.satisfactionRating === "HAI_LONG"
                    ? "Hài lòng"
                    : d.satisfactionRating === "BINH_THUONG"
                    ? "Bình thường"
                    : "Chưa hài lòng"}
                  {d.satisfactionComment ? ` — "${d.satisfactionComment}"` : ""}
                </p>
              ) : (
                <form onSubmit={handleRateSubmit} className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-3 text-xs">
                    {[
                      { val: "RAT_HAI_LONG", label: "Rất hài lòng" },
                      { val: "HAI_LONG", label: "Hài lòng" },
                      { val: "BINH_THUONG", label: "Bình thường" },
                      { val: "CHUA_HAI_LONG", label: "Chưa hài lòng" },
                    ].map((opt) => (
                      <label key={opt.val} className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="sipas"
                          checked={rating === opt.val}
                          onChange={() =>
                            setRating(opt.val as "RAT_HAI_LONG" | "HAI_LONG" | "BINH_THUONG" | "CHUA_HAI_LONG")
                          }
                          className="accent-[#991b1b]"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Ý kiến góp ý thêm về thái độ phục vụ, thời gian giải quyết..."
                      className="flex-1 px-3 py-1.5 text-xs border border-[#9ca3af] bg-white rounded-[2px]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold bg-[#991b1b] text-white rounded-[2px] cursor-pointer"
                    >
                      Gửi phiếu đánh giá
                    </button>
                  </div>
                  {ratingMessage && (
                    <p role="status" className="text-xs font-semibold text-[#15803d]">
                      {ratingMessage}
                    </p>
                  )}
                  {ratingError && (
                    <p
                      role="alert"
                      className="text-xs font-semibold text-[#991b1b] bg-[#fef2f2] border border-[#dc2626] px-2.5 py-1.5 rounded-[2px]"
                    >
                      {ratingError}
                    </p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {printForm && d && result?.pinVerified && (
        <OfficialFormsPrintModal
          formType={printForm}
          dossier={d}
          onClose={() => setPrintForm(null)}
        />
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center text-sm">Đang tải tra cứu...</div>}>
          <TrackDossierContent />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
