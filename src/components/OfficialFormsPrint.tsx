"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
import { DOSSIER_STATUS_LABELS, ROLE_LABELS } from "@/lib/workflow-engine";
import { DossierStatus, Role } from "@prisma/client";

export type FormTemplateType =
  | "MAU_01"
  | "MAU_02"
  | "MAU_03"
  | "MAU_04"
  | "MAU_05"
  | "BIEN_LAI";

interface PrintableDossier {
  dossierCode: string;
  trackingPin?: string;
  applicantName: string;
  applicantCitizenId: string;
  applicantPhone: string;
  applicantAddress: string;
  representativeName?: string | null;
  authorizationNote?: string | null;
  summary: string;
  copiesCount: number;
  feeAmount: number;
  feeExempt: boolean;
  feeExemptReason?: string | null;
  feeStatus: string;
  receiptNumber?: string | null;
  paidAt?: string | null;
  submittedAt: string;
  acceptedAt?: string | null;
  dueAt?: string | null;
  supplementReason?: string | null;
  supplementDeadline?: string | null;
  rejectionReason?: string | null;
  rejectionLegalBasis?: string | null;
  apologyFormCode?: string | null;
  apologyReason?: string | null;
  procedure: {
    code: string;
    name: string;
    field: string;
    processingDays: number;
  };
  department: {
    name: string;
    roomNumber?: string;
    phoneExt?: string;
  };
  receiver?: { fullName: string; positionTitle?: string | null } | null;
  approver?: { fullName: string; positionTitle?: string | null } | null;
  attachments?: Array<{
    id: string;
    docName: string;
    submittedType: string;
    quantity: number;
    isVerified: boolean;
  }>;
  histories?: Array<{
    id: string;
    actionName: string;
    actorName?: string;
    actorRole: string;
    toStatus: string;
    note?: string | null;
    createdAt: string;
  }>;
}

const VN_DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

function readThreeDigits(num: number, readZeroHundred: boolean): string {
  const hundreds = Math.floor(num / 100);
  const tens = Math.floor((num % 100) / 10);
  const units = num % 10;
  const parts: string[] = [];

  if (hundreds > 0 || readZeroHundred) {
    parts.push(`${VN_DIGITS[hundreds]} trăm`);
  }

  if (tens === 0) {
    if (units > 0 && (hundreds > 0 || readZeroHundred)) {
      parts.push("lẻ");
    }
  } else if (tens === 1) {
    parts.push("mười");
  } else {
    parts.push(`${VN_DIGITS[tens]} mươi`);
  }

  if (units > 0) {
    if (units === 1 && tens >= 2) {
      parts.push("mốt");
    } else if (units === 4 && tens >= 2) {
      parts.push("tư");
    } else if (units === 5 && tens >= 1) {
      parts.push("lăm");
    } else {
      parts.push(VN_DIGITS[units]);
    }
  }

  return parts.join(" ");
}

export function numberToVietnameseCurrency(amount: number): string {
  const clean = Math.floor(Math.abs(amount));
  if (clean <= 0) return "Không đồng (Miễn lệ phí)";

  const scales = ["", "nghìn", "triệu", "tỷ"];
  const groups: number[] = [];
  let temp = clean;
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const grp = groups[i];
    if (grp === 0) continue;
    const isLeadingGroup = i === groups.length - 1;
    const chunk = readThreeDigits(grp, !isLeadingGroup);
    const scale = scales[i] || "";
    words.push(scale ? `${chunk} ${scale}` : chunk);
  }

  const raw = words.join(" ").replace(/\s+/g, " ").trim();
  const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
  return clean % 1000 === 0 ? `${capitalized} đồng chẵn` : `${capitalized} đồng`;
}

function resolveFormSymbol(formType: FormTemplateType, dossier: PrintableDossier): string {
  const seq = dossier.dossierCode.slice(-4);
  switch (formType) {
    case "MAU_01":
      return `${seq}/GTN-BPTNTKQ`;
    case "MAU_02":
      return `${seq}/PYCBS-BPTNTKQ`;
    case "MAU_03":
      return `${seq}/PTCTN-BPTNTKQ`;
    case "MAU_04":
      return dossier.apologyFormCode || `PXL-2026-${seq}`;
    case "MAU_05":
      return `${seq}/PKS-BPTNTKQ`;
    case "BIEN_LAI":
      return dossier.receiptNumber || `BL-2026-${seq}`;
  }
}

export function OfficialFormsPrintModal({
  formType,
  dossier,
  onClose,
}: {
  formType: FormTemplateType;
  dossier: PrintableDossier;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.classList.add("printing-form");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("printing-form");
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  const titles: Record<FormTemplateType, { code: string; name: string }> = {
    MAU_01: {
      code: "Mẫu số 01 (Ban hành kèm theo quy chế Một cửa liên thông)",
      name: "GIẤY TIẾP NHẬN HỒ SƠ VÀ HẸN TRẢ KẾT QUẢ",
    },
    MAU_02: {
      code: "Mẫu số 02 (Phiếu hướng dẫn hoàn thiện hồ sơ)",
      name: "PHIẾU YÊU CẦU BỔ SUNG, HOÀN THIỆN HỒ SƠ",
    },
    MAU_03: {
      code: "Mẫu số 03 (Thông báo từ chối giải quyết)",
      name: "PHIẾU TỪ CHỐI TIẾP NHẬN GIẢI QUYẾT HỒ SƠ",
    },
    MAU_04: {
      code: "Mẫu số 04 (Gia hạn thời gian giải quyết TTHC)",
      name: "PHIẾU XIN LỖI VÀ HẸN LẠI NGÀY TRẢ KẾT QUẢ",
    },
    MAU_05: {
      code: "Mẫu số 05 (Theo dõi luân chuyển nội bộ theo Thông tư 01/2018/TT-VPCP)",
      name: "PHIẾU KIỂM SOÁT QUÁ TRÌNH GIẢI QUYẾT HỒ SƠ",
    },
    BIEN_LAI: {
      code: "Mẫu CTT50 - Biên lai thu phí, lệ phí điện tử",
      name: "BIÊN LAI THU TIỀN PHÍ, LỆ PHÍ HÀNH CHÍNH",
    },
  };

  const modalContent = (
    <div className="official-print-portal">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titles[formType].name}
        className="official-print-backdrop fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-3 sm:p-8"
      >
        <div className="official-print-card bg-white w-full max-w-4xl border border-[#111827] shadow-xl rounded-[2px]">
          {/* Thanh điều khiển không hiển thị khi in */}
          <div className="no-print bg-[#b91c1c] text-white px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#f59e0b]">
            <div>
              <p className="text-xs text-[#fef08a] font-medium">{titles[formType].code}</p>
              <p className="text-sm font-bold">{titles[formType].name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#fce8a6] text-[#881318] hover:bg-[#fef08a] rounded-[2px] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                In biểu mẫu khổ A4
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-white/15 hover:bg-white/25 rounded-[2px] cursor-pointer"
              >
                <X className="w-4 h-4" />
                Đóng
              </button>
            </div>
          </div>

          {/* Nội dung trang in A4 chuẩn thể thức hành chính Việt Nam */}
          <div className="a4-print-sheet p-5 sm:p-12 text-[#000000] font-official-serif leading-relaxed text-[14px]">
            <div className="grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 gap-4 text-center mb-6">
              <div className="sm:col-span-5 print:col-span-5">
                <p className="font-bold uppercase text-[12px]">ỦY BAN NHÂN DÂN PHƯỜNG THANH NHÀN</p>
                <p className="font-bold uppercase text-[12px]">BỘ PHẬN TIẾP NHẬN VÀ TRẢ KẾT QUẢ</p>
                <div className="w-24 h-[1px] bg-black mx-auto mt-1" />
                <p className="text-[12px] mt-1.5 tabular-nums">
                  Số: {resolveFormSymbol(formType, dossier)}
                </p>
              </div>
              <div className="sm:col-span-7 print:col-span-7">
                <p className="font-bold uppercase text-[13px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-[13px]">Độc lập - Tự do - Hạnh phúc</p>
                <div className="w-36 h-[1px] bg-black mx-auto mt-1" />
                <p className="italic text-[12px] mt-1.5">
                  Thanh Nhàn, ngày {day} tháng {month} năm {year}
                </p>
              </div>
            </div>

          <div className="text-center my-6">
            <h2 className="text-[17px] font-bold uppercase">{titles[formType].name}</h2>
            <p className="text-[12px] italic mt-0.5">
              Mã số hồ sơ: <strong className="not-italic tabular-nums">{dossier.dossierCode}</strong>
              {dossier.trackingPin ? (
                <span>
                  {" "}
                  • Mã PIN tra cứu trực tuyến:{" "}
                  <strong className="not-italic tabular-nums">{dossier.trackingPin}</strong>
                </span>
              ) : null}
            </p>
          </div>

          <div className="space-y-2.5 text-[14px]">
            <p>
              <strong>Bộ phận Tiếp nhận và Trả kết quả - UBND Phường Thanh Nhàn</strong> xác nhận thông tin đối với ông/bà (tổ chức):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-1.5 pl-2">
              <p>
                - Họ và tên người yêu cầu: <strong>{dossier.applicantName}</strong>
              </p>
              <p className="tabular-nums">
                - Số CCCD / Định danh: <strong>{dossier.applicantCitizenId}</strong>
              </p>
              <p className="tabular-nums">- Số điện thoại liên hệ: {dossier.applicantPhone}</p>
              <p>- Địa chỉ: {dossier.applicantAddress}</p>
            </div>
            {dossier.representativeName && (
              <p className="pl-2">
                - Người được ủy quyền nộp thay: <strong>{dossier.representativeName}</strong> ({dossier.authorizationNote})
              </p>
            )}
            <p>
              - Thủ tục hành chính: <strong>[{dossier.procedure.code}] {dossier.procedure.name}</strong> ({dossier.procedure.field})
            </p>
            <p>- Nội dung yêu cầu giải quyết: {dossier.summary}</p>
            <p>- Cơ quan/Bộ phận chuyên môn chủ trì: {dossier.department.name}</p>

            {formType === "MAU_01" && (
              <>
                <div className="mt-4 overflow-x-auto">
                  <p className="font-bold mb-1.5">Thành phần hồ sơ đã tiếp nhận gồm:</p>
                  <table className="w-full border-collapse border border-black text-[13px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black px-2 py-1 text-center w-12">STT</th>
                        <th className="border border-black px-2 py-1 text-left">Tên giấy tờ, tài liệu trong hồ sơ</th>
                        <th className="border border-black px-2 py-1 text-center w-36">Hình thức nộp</th>
                        <th className="border border-black px-2 py-1 text-center w-20">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dossier.attachments || []).map((att, idx) => (
                        <tr key={att.id}>
                          <td className="border border-black px-2 py-1 text-center tabular-nums">{idx + 1}</td>
                          <td className="border border-black px-2 py-1">{att.docName}</td>
                          <td className="border border-black px-2 py-1 text-center">
                            {att.submittedType === "BAN_CHINH"
                              ? "Bản chính"
                              : att.submittedType === "BAN_SAO_CHUNG_THUC"
                              ? "Bản sao chứng thực"
                              : "Bản điện tử"}
                          </td>
                          <td className="border border-black px-2 py-1 text-center tabular-nums">{att.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 pt-2 tabular-nums">
                  <p>
                    - Thời gian tiếp nhận chính thức:{" "}
                    <strong>
                      {dossier.acceptedAt
                        ? new Date(dossier.acceptedAt).toLocaleString("vi-VN")
                        : new Date(dossier.submittedAt).toLocaleString("vi-VN")}
                    </strong>
                  </p>
                  <p>
                    - Thời gian hẹn trả kết quả:{" "}
                    <strong>
                      {dossier.dueAt
                        ? new Date(dossier.dueAt).toLocaleString("vi-VN")
                        : `${dossier.procedure.processingDays} ngày làm việc kể từ khi đủ hồ sơ`}
                    </strong>
                  </p>
                  <p>
                    - Mức lệ phí quy định:{" "}
                    <strong>{dossier.feeExempt ? "Miễn lệ phí (0 đồng)" : `${dossier.feeAmount.toLocaleString("vi-VN")} đồng`}</strong>
                  </p>
                  <p>- Hình thức nhận kết quả: Tại {dossier.department.roomNumber || "Quầy Một cửa Tầng 1"} và Bản điện tử</p>
                </div>
              </>
            )}

            {formType === "MAU_02" && (
              <div className="mt-4 p-3 border border-black space-y-2">
                <p className="font-bold">Nội dung yêu cầu bổ sung, hoàn thiện hồ sơ:</p>
                <p>{dossier.supplementReason || "Đề nghị bổ sung thành phần giấy tờ còn thiếu theo quy định."}</p>
                <p className="tabular-nums">
                  - Thời hạn đề nghị hoàn thiện bổ sung:{" "}
                  <strong>
                    {dossier.supplementDeadline
                      ? new Date(dossier.supplementDeadline).toLocaleDateString("vi-VN")
                      : "Trong vòng 05 ngày làm việc"}
                  </strong>
                </p>
                <p className="italic text-[13px]">
                  Lưu ý: Thời gian công dân hoàn thiện bổ sung hồ sơ không tính vào thời hạn giải quyết của cơ quan hành chính. Sau khi nộp bổ sung đầy đủ, đồng hồ SLA sẽ tiếp tục được kích hoạt.
                </p>
              </div>
            )}

            {formType === "MAU_03" && (
              <div className="mt-4 p-3 border border-black space-y-2">
                <p className="font-bold">Lý do không tiếp nhận giải quyết hồ sơ:</p>
                <p>{dossier.rejectionReason || "Hồ sơ không đủ điều kiện tiếp nhận theo quy định."}</p>
                <p>
                  <strong>Căn cứ pháp lý áp dụng:</strong> {dossier.rejectionLegalBasis || "Nghị định số 61/2018/NĐ-CP về cơ chế Một cửa."}
                </p>
              </div>
            )}

            {formType === "MAU_04" && (
              <div className="mt-4 p-3 border border-black space-y-2">
                <p>
                  Ủy ban nhân dân Phường Thanh Nhàn trân trọng xin lỗi ông/bà <strong>{dossier.applicantName}</strong> về sự chậm trễ trong việc trả kết quả giải quyết hồ sơ mã số <strong>{dossier.dossierCode}</strong>.
                </p>
                <p>
                  <strong>Lý do gia hạn thời gian giải quyết:</strong>{" "}
                  {dossier.apologyReason || "Cần xác minh bổ sung hồ sơ chuyên môn liên ngành."}
                </p>
                <p className="tabular-nums">
                  <strong>Thời gian hẹn trả kết quả mới:</strong>{" "}
                  {dossier.dueAt ? new Date(dossier.dueAt).toLocaleString("vi-VN") : "Theo lịch hẹn bổ sung"} (Gia hạn lần thứ 01 - tối đa không quá 01 lần).
                </p>
              </div>
            )}

            {formType === "MAU_05" && (
              <div className="mt-4 overflow-x-auto">
                <p className="font-bold mb-1.5">Bảng kê chi tiết quá trình giao nhận, thẩm định và phê duyệt hồ sơ:</p>
                <table className="w-full border-collapse border border-black text-[12px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black px-2 py-1 text-center w-10">Bước</th>
                      <th className="border border-black px-2 py-1 text-left">Nội dung tác nghiệp</th>
                      <th className="border border-black px-2 py-1 text-left">Cán bộ / Vai trò thực hiện</th>
                      <th className="border border-black px-2 py-1 text-center w-36">Thời điểm ghi nhận</th>
                      <th className="border border-black px-2 py-1 text-left">Trạng thái / Ý kiến</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dossier.histories || []).map((h, idx) => (
                      <tr key={h.id}>
                        <td className="border border-black px-2 py-1 text-center tabular-nums">{idx + 1}</td>
                        <td className="border border-black px-2 py-1 font-semibold">{h.actionName}</td>
                        <td className="border border-black px-2 py-1">
                          {h.actorName ? `${h.actorName} (${ROLE_LABELS[h.actorRole as Role] || h.actorRole})` : ROLE_LABELS[h.actorRole as Role] || h.actorRole}
                        </td>
                        <td className="border border-black px-2 py-1 text-center tabular-nums">
                          {new Date(h.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="border border-black px-2 py-1">
                          <div>{DOSSIER_STATUS_LABELS[h.toStatus as DossierStatus] || h.toStatus}</div>
                          {h.note && <div className="italic text-[11px] mt-0.5">{h.note}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {formType === "BIEN_LAI" && (
              <div className="mt-4 p-4 border border-black space-y-2 tabular-nums">
                <p>
                  - Số biên lai điện tử: <strong>{dossier.receiptNumber || "CHƯA PHÁT HÀNH"}</strong>
                </p>
                <p>
                  - Nội dung thu: Thu lệ phí giải quyết TTHC ({dossier.procedure.name}) - Số lượng: {dossier.copiesCount} bản
                </p>
                <p>
                  - Số tiền thu bằng số: <strong>{dossier.feeAmount.toLocaleString("vi-VN")} đồng</strong>
                </p>
                <p>
                  - Số tiền viết bằng chữ: <em>{numberToVietnameseCurrency(dossier.feeAmount)}</em>
                </p>
                <p>
                  - Thời điểm thanh toán:{" "}
                  {dossier.paidAt ? new Date(dossier.paidAt).toLocaleString("vi-VN") : "Chưa thanh toán"}
                </p>
              </div>
            )}
          </div>

          {/* Chữ ký & Con dấu đỏ xác nhận điện tử */}
          <div className="signature-block grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-8 mt-10 text-center text-[13px]">
            <div>
              <p className="font-bold uppercase">NGƯỜI NỘP HỒ SƠ / ĐỐI CHIẾU</p>
              <p className="italic text-[12px]">(Ký và ghi rõ họ tên)</p>
              <div className="h-16 sm:h-20" />
              <p className="font-semibold">{dossier.representativeName || dossier.applicantName}</p>
            </div>
            <div className="relative">
              <p className="font-bold uppercase">
                {formType === "MAU_04" ? "THỦ TRƯỞNG CƠ QUAN" : "CÔNG CHỨC TIẾP NHẬN / KIỂM SOÁT"}
              </p>
              <p className="italic text-[12px]">(Ký tên, xác thực điện tử)</p>
              <div className="h-16 sm:h-20 flex items-center justify-center">
                <div className="inline-block border-2 border-[#b91c1c] text-[#b91c1c] px-3 py-1 rounded-[2px] text-[11px] font-bold uppercase tracking-wider rotate-[-3deg]">
                  ĐÃ XÁC THỰC ĐIỆN TỬ • UBND P. THANH NHÀN
                </div>
              </div>
              <p className="font-semibold">
                {formType === "MAU_04"
                  ? dossier.approver?.fullName || "Trần Quốc Bảo"
                  : dossier.receiver?.fullName || "Lê Thị Thu Hà"}
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modalContent;
  }
  return createPortal(modalContent, document.body);
}
