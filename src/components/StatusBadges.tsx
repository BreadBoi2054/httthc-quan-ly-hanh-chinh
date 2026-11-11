import React from "react";
import { DOSSIER_STATUS_LABELS, FEE_STATUS_LABELS, ROLE_LABELS } from "@/lib/workflow-engine";
import { DossierStatus, FeeStatus, Role } from "@prisma/client";

export function DossierStatusBadge({ status }: { status: DossierStatus | string }) {
  const styles: Record<string, string> = {
    MOI_NOP: "bg-[#fef3c7] text-[#92400e] border-[#f59e0b]",
    DA_TIEP_NHAN: "bg-[#e0f2fe] text-[#075985] border-[#0284c7]",
    YEU_CAU_BO_SUNG: "bg-[#ffedd5] text-[#9a3412] border-[#ea580c]",
    DANG_THAM_DINH: "bg-[#dbeafe] text-[#1e40af] border-[#2563eb]",
    CHO_PHE_DUYET: "bg-[#fef9c3] text-[#854d0e] border-[#ca8a04]",
    CHO_TRA_KET_QUA: "bg-[#dcfce7] text-[#166534] border-[#16a34a]",
    HOAN_THANH: "bg-[#14532d] text-white border-[#14532d]",
    TU_CHOI_TIEP_NHAN: "bg-[#fee2e2] text-[#991b1b] border-[#dc2626]",
    DA_RUT_HO_SO: "bg-[#f3f4f6] text-[#374151] border-[#9ca3af]",
  };

  const label = DOSSIER_STATUS_LABELS[status as DossierStatus] || status;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold border rounded-[2px] whitespace-nowrap ${
        styles[status] || "bg-gray-100 text-gray-800 border-gray-300"
      }`}
    >
      {label}
    </span>
  );
}

export function SlaBadge({
  state,
  label,
}: {
  state: string;
  label: string;
}) {
  const styles: Record<string, string> = {
    TRONG_HAN: "bg-[#ecfdf5] text-[#166534] border-[#86efac]",
    SAP_DEN_HAN: "bg-[#fffbeb] text-[#b45309] border-[#f59e0b]",
    QUA_HAN: "bg-[#fef2f2] text-[#b91c1c] border-[#ef4444] font-bold",
    DA_HOAN_THANH_DUNG_HAN: "bg-[#f0fdf4] text-[#15803d] border-[#86efac]",
    DA_HOAN_THANH_QUA_HAN: "bg-[#fff1f2] text-[#be123c] border-[#fda4af]",
    TAM_DUNG_CHO_BO_SUNG: "bg-[#fff7ed] text-[#9a3412] border-[#fdba74]",
  QUA_HAN_BO_SUNG: "bg-[#fef2f2] text-[#991b1b] border-[#ef4444] font-bold",
    CHUA_TIEP_NHAN: "bg-[#f9fafb] text-[#4b5563] border-[#d1d5db]",
    KET_THUC_KHONG_GIAI_QUYET: "bg-[#f3f4f6] text-[#4b5563] border-[#d1d5db]",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs border rounded-[2px] tabular-nums whitespace-nowrap ${
        styles[state] || "bg-gray-100 text-gray-700 border-gray-300"
      }`}
    >
      {label}
    </span>
  );
}

export function FeeBadge({ status, amount }: { status: FeeStatus | string; amount: number }) {
  const styles: Record<string, string> = {
    MIEN_PHI: "text-[#15803d] bg-[#f0fdf4] border-[#bbf7d0]",
    CHUA_THU_PHI: "text-[#b91c1c] bg-[#fef2f2] border-[#fecaca] font-semibold",
    DA_THU_PHI: "text-[#166534] bg-[#dcfce7] border-[#86efac]",
    HOAN_PHI: "text-[#4b5563] bg-[#f3f4f6] border-[#d1d5db]",
  };

  const baseLabel = FEE_STATUS_LABELS[status as FeeStatus] || status;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs border rounded-[2px] tabular-nums ${
        styles[status] || "bg-gray-100 text-gray-700 border-gray-300"
      }`}
    >
      {status === "MIEN_PHI" ? baseLabel : `${baseLabel} (${amount.toLocaleString("vi-VN")} đ)`}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role | string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#fef3c7] text-[#78350f] border border-[#f59e0b] rounded-[2px]">
      {ROLE_LABELS[role as Role] || role}
    </span>
  );
}
