"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { DossierStatusBadge, FeeBadge, SlaBadge } from "@/components/StatusBadges";
import {
  FilePlus2,
  CreditCard,
  Upload,
  XCircle,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";

interface CitizenDossier {
  id: string;
  dossierCode: string;
  trackingPin: string;
  status: string;
  summary: string;
  feeAmount: number;
  feeExempt: boolean;
  feeStatus: string;
  receiptNumber?: string | null;
  submittedAt: string;
  dueAt?: string | null;
  supplementReason?: string | null;
  resultDocNumber?: string | null;
  isDigitizedResult?: boolean;
  electronicResultCode?: string | null;
  procedure: { code: string; name: string; field: string };
  department: { name: string };
  sla: { state: string; label: string };
}

export default function CitizenPortalPage() {
  const [dossiers, setDossiers] = useState<CitizenDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplementId, setSupplementId] = useState<string | null>(null);
  const [supplementFile, setSupplementFile] = useState("BoSung_HopDongThueDayDuChuKy.pdf");
  const [supplementNote, setSupplementNote] = useState("");
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadDossiers = useCallback(() => {
    setLoading(true);
    fetch("/api/dossiers")
      .then((r) => r.json())
      .then((data) => setDossiers(data.dossiers || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDossiers();
  }, [loadDossiers]);

  async function executeCitizenAction(
    dossierId: string,
    action: "THU_LE_PHI" | "BO_SUNG_HO_SO" | "RUT_HO_SO",
    extra?: Record<string, unknown>
  ) {
    setFeedback("");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể thực hiện thao tác trên hồ sơ.");
        return;
      }
      setFeedback("Thực hiện thao tác thành công! Trạng thái hồ sơ đã được cập nhật.");
      setSupplementId(null);
      setConfirmWithdrawId(null);
      loadDossiers();
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ khi thực hiện thao tác.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#991b1b] pb-3">
          <div>
            <h1 className="text-xl font-bold text-[#991b1b] uppercase font-official-serif">
              Kho Hồ sơ Hành chính Cá nhân
            </h1>
            <p className="text-sm text-[#4b5563]">
              Theo dõi tiến độ, thanh toán lệ phí trực tuyến, nộp bổ sung giấy tờ và nhận kết quả điện tử.
            </p>
          </div>
          <Link
            href="/nop-ho-so"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-[2px]"
          >
            <FilePlus2 className="w-4 h-4" />
            Nộp hồ sơ mới
          </Link>
        </div>

        {feedback && (
          <div
            role="status"
            className="p-3.5 bg-[#ecfdf5] border border-[#16a34a] text-xs font-semibold text-[#166534] flex items-center gap-2 rounded-[2px]"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 bg-[#fef2f2] border border-[#dc2626] text-xs font-semibold text-[#991b1b] flex items-center gap-2 rounded-[2px]"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-[#d6d3cd] p-8 text-center text-sm">
            Đang tải danh sách hồ sơ của công dân...
          </div>
        ) : dossiers.length === 0 ? (
          <div className="bg-white border border-[#d6d3cd] p-8 text-center text-sm text-[#4b5563]">
            Ông/bà chưa có hồ sơ trực tuyến nào. Bấm &ldquo;Nộp hồ sơ mới&rdquo; để bắt đầu.
          </div>
        ) : (
          <div className="space-y-4">
            {dossiers.map((d) => (
              <div key={d.id} className="bg-white border border-[#d6d3cd] p-5 rounded-[2px] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f3f4f6] pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm text-[#991b1b] tabular-nums">{d.dossierCode}</span>
                    <span className="text-xs bg-[#f3f4f6] px-2 py-0.5 rounded-[2px] tabular-nums">
                      PIN: <strong>{d.trackingPin}</strong>
                    </span>
                    <DossierStatusBadge status={d.status} />
                    <SlaBadge state={d.sla.state} label={d.sla.label} />
                    {d.isDigitizedResult && d.electronicResultCode && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#dcfce7] text-[#166534] border border-[#86efac] px-2 py-0.5 rounded-[2px] tabular-nums">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        KQĐT: {d.electronicResultCode}
                      </span>
                    )}
                  </div>
                  <FeeBadge status={d.feeStatus} amount={d.feeAmount} />
                </div>

                <div>
                  <p className="font-bold text-sm text-[#111827]">
                    [{d.procedure.code}] {d.procedure.name}
                  </p>
                  <p className="text-xs text-[#4b5563] mt-0.5">{d.summary}</p>
                </div>

                {d.status === "YEU_CAU_BO_SUNG" && d.supplementReason && (
                  <div className="bg-[#fff7ed] border-l-4 border-[#ea580c] p-3 text-xs text-[#9a3412] space-y-2">
                    <p className="font-bold">Yêu cầu bổ sung hồ sơ (Mẫu 02):</p>
                    <p>{d.supplementReason}</p>
                    {supplementId === d.id ? (
                      <div className="pt-2 space-y-2">
                        <input
                          type="text"
                          value={supplementFile}
                          onChange={(e) => setSupplementFile(e.target.value)}
                          placeholder="Tên tệp bổ sung đính kèm..."
                          className="w-full px-2.5 py-1.5 border border-[#fdba74] bg-white text-[#111827] rounded-[2px]"
                        />
                        <input
                          type="text"
                          value={supplementNote}
                          onChange={(e) => setSupplementNote(e.target.value)}
                          placeholder="Ghi chú giải trình bổ sung..."
                          className="w-full px-2.5 py-1.5 border border-[#fdba74] bg-white text-[#111827] rounded-[2px]"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              executeCitizenAction(d.id, "BO_SUNG_HO_SO", {
                                newAttachmentName: supplementFile,
                                note: supplementNote || "Công dân nộp bổ sung tài liệu trực tuyến theo Mẫu 02.",
                              })
                            }
                            className="px-3 py-1.5 bg-[#9a3412] text-white font-bold rounded-[2px] cursor-pointer"
                          >
                            Xác nhận gửi bổ sung
                          </button>
                          <button
                            type="button"
                            onClick={() => setSupplementId(null)}
                            className="px-3 py-1.5 border border-[#9ca3af] bg-white text-[#111827] rounded-[2px] cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSupplementId(d.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#ea580c] text-white font-bold rounded-[2px] cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Tải lên tài liệu bổ sung ngay
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <div className="text-[#4b5563] tabular-nums">
                    Ngày gửi: {new Date(d.submittedAt).toLocaleString("vi-VN")}
                    {d.dueAt ? ` • Hạn trả: ${new Date(d.dueAt).toLocaleString("vi-VN")}` : ""}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!d.feeExempt &&
                      d.feeAmount > 0 &&
                      d.feeStatus === "CHUA_THU_PHI" &&
                      ["DA_TIEP_NHAN", "DANG_THAM_DINH", "CHO_PHE_DUYET", "CHO_TRA_KET_QUA"].includes(d.status) && (
                        <button
                          type="button"
                          onClick={() =>
                            executeCitizenAction(d.id, "THU_LE_PHI", {
                              note: "Công dân thanh toán lệ phí trực tuyến trên Cổng Dịch vụ Hành chính công.",
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white font-bold rounded-[2px] cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Nộp lệ phí trực tuyến ({d.feeAmount.toLocaleString("vi-VN")} đ)
                        </button>
                      )}

                    {["MOI_NOP", "DA_TIEP_NHAN", "YEU_CAU_BO_SUNG", "DANG_THAM_DINH"].includes(d.status) &&
                      (confirmWithdrawId === d.id ? (
                        <div className="inline-flex items-center gap-1.5 bg-[#fef2f2] border border-[#dc2626] px-2 py-1 rounded-[2px]">
                          <span className="text-[#991b1b] font-semibold">Xác nhận rút?</span>
                          <button
                            type="button"
                            onClick={() =>
                              executeCitizenAction(d.id, "RUT_HO_SO", {
                                note: "Công dân chủ động rút hồ sơ trên Cổng cá nhân.",
                              })
                            }
                            className="px-2 py-0.5 bg-[#991b1b] text-white font-bold rounded-[2px] cursor-pointer"
                          >
                            Đồng ý rút
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmWithdrawId(null)}
                            className="px-2 py-0.5 bg-white border border-[#9ca3af] text-[#111827] font-medium rounded-[2px] cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmWithdrawId(d.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#dc2626] text-[#991b1b] hover:bg-[#fef2f2] font-semibold rounded-[2px] cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rút hồ sơ
                        </button>
                      ))}

                    <Link
                      href={`/tra-cuu?code=${d.dossierCode}&pin=${d.trackingPin}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1e3a5f] hover:bg-[#152c4a] text-white font-semibold rounded-[2px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Biểu mẫu &amp; Nhật ký xử lý
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
