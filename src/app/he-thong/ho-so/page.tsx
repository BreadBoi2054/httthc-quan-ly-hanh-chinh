"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DossierStatusBadge, FeeBadge, SlaBadge } from "@/components/StatusBadges";
import { DOSSIER_STATUS_LABELS, FEE_STATUS_LABELS } from "@/lib/workflow-engine";
import { downloadOfficialCsv } from "@/lib/csv-export";
import { Search, FilePlus2, Download, X, RotateCcw } from "lucide-react";

interface DossierRow {
  id: string;
  dossierCode: string;
  applicantName: string;
  applicantCitizenId: string;
  applicantPhone: string;
  channel: string;
  status: string;
  feeAmount: number;
  feeStatus: string;
  submittedAt: string;
  dueAt?: string | null;
  procedure: { id: string; code: string; name: string; field: string };
  department: { id: string; code: string; name: string };
  assignee?: { fullName: string } | null;
  sla: { state: string; label: string };
}

interface ProcedureItem {
  id: string;
  code: string;
  name: string;
  requiredDocs: Array<{ code: string; name: string; mandatory: boolean }>;
}

function StaffDossiersListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openIntakeInit = searchParams.get("intake") === "1";

  const [dossiers, setDossiers] = useState<DossierRow[]>([]);
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [slaFilter, setSlaFilter] = useState("ALL");
  const [scopeAll, setScopeAll] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [q, setQ] = useState("");

  // Modal tiếp nhận trực tiếp tại quầy Một cửa
  const [showIntakeModal, setShowIntakeModal] = useState(openIntakeInit);
  const [intakeProcId, setIntakeProcId] = useState("");
  const [intakeChannel, setIntakeChannel] = useState<"TRUC_TIEP" | "BUU_CHINH">("TRUC_TIEP");
  const [intakeName, setIntakeName] = useState("");
  const [intakeCid, setIntakeCid] = useState("");
  const [intakePhone, setIntakePhone] = useState("");
  const [intakeAddress, setIntakeAddress] = useState("");
  const [intakeSummary, setIntakeSummary] = useState("");
  const [intakeAutoAccept, setIntakeAutoAccept] = useState(true);
  const [intakeError, setIntakeError] = useState("");
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);

  const loadDossiers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (slaFilter !== "ALL") params.set("sla", slaFilter);
    if (scopeAll) params.set("scope", "all");
    if (q.trim()) params.set("q", q.trim());

    fetch(`/api/dossiers?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setDossiers(data.dossiers || []))
      .finally(() => setLoading(false));
  }, [statusFilter, slaFilter, scopeAll, q]);

  useEffect(() => {
    loadDossiers();
  }, [loadDossiers]);

  useEffect(() => {
    if (!showIntakeModal) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowIntakeModal(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showIntakeModal]);

  useEffect(() => {
    Promise.all([
      fetch("/api/procedures").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([data, me]) => {
      const list = data.procedures || [];
      setProcedures(list);
      if (list[0]) setIntakeProcId(list[0].id);
      if (me?.user?.role) {
        setUserRole(me.user.role);
        if (me.user.role !== "CHUYEN_VIEN") {
          setScopeAll(true);
        }
      }
    });
  }, []);

  async function handleCounterIntakeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIntakeError("");
    const selectedProc = procedures.find((p) => p.id === intakeProcId);
    if (!selectedProc) return;

    setIntakeSubmitting(true);
    try {
      const attachments = selectedProc.requiredDocs
        .filter((d) => d.mandatory)
        .map((d) => ({
          docCode: d.code,
          docName: d.name,
          isMandatory: true,
          submittedType: "BAN_CHINH" as const,
          quantity: 1,
          fileName: `${d.code}_TaiQuayMotCua.pdf`,
        }));

      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureId: intakeProcId,
          applicantName: intakeName,
          applicantCitizenId: intakeCid,
          applicantPhone: intakePhone,
          applicantAddress: intakeAddress,
          channel: intakeChannel,
          autoAccept: intakeAutoAccept,
          summary: intakeSummary,
          copiesCount: 1,
          feeExempt: false,
          attachments,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIntakeError(data.error || "Không thể tạo hồ sơ tại quầy");
        setIntakeSubmitting(false);
        return;
      }

      setShowIntakeModal(false);
      router.push(`/he-thong/ho-so/${data.dossier.id}`);
    } catch {
      setIntakeError("Lỗi kết nối máy chủ.");
      setIntakeSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d6d3cd] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827] font-official-serif">
            Sổ Theo dõi &amp; Giải quyết Hồ sơ Một cửa Liên thông
          </h1>
          <p className="text-xs text-[#4b5563] mt-0.5">
            Quản lý tiếp nhận, thẩm định chuyên môn, trình ký duyệt, thu lệ phí và trả kết quả cho công dân.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={dossiers.length === 0}
            onClick={() =>
              downloadOfficialCsv(
                `SoTheoDoi_HoSoMotCua_${new Date().toISOString().slice(0, 10)}.csv`,
                [
                  "Mã Hồ sơ",
                  "Chủ hồ sơ",
                  "Số CCCD",
                  "Điện thoại",
                  "Mã TTHC",
                  "Tên Thủ tục",
                  "Bộ phận thụ lý",
                  "Chuyên viên",
                  "Trạng thái",
                  "Tình trạng Lệ phí",
                  "Mức phí (VNĐ)",
                  "Tiến độ SLA",
                  "Ngày nộp",
                  "Hạn trả",
                ],
                dossiers.map((d) => [
                  d.dossierCode,
                  d.applicantName,
                  d.applicantCitizenId,
                  d.applicantPhone,
                  d.procedure.code,
                  d.procedure.name,
                  d.department.name,
                  d.assignee?.fullName || "",
                  DOSSIER_STATUS_LABELS[d.status as keyof typeof DOSSIER_STATUS_LABELS] || d.status,
                  FEE_STATUS_LABELS[d.feeStatus as keyof typeof FEE_STATUS_LABELS] || d.feeStatus,
                  d.feeAmount,
                  d.sla.label,
                  new Date(d.submittedAt).toLocaleString("vi-VN"),
                  d.dueAt ? new Date(d.dueAt).toLocaleString("vi-VN") : "",
                ])
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-[#ce1126] text-[#991b1b] bg-white hover:bg-[#fef2f2] disabled:opacity-50 rounded-[2px] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Xuất Sổ CSV (Excel)
          </button>

          {(userRole === "MOT_CUA" || userRole === "QUAN_TRI") && (
            <button
              type="button"
              onClick={() => setShowIntakeModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-[2px] cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              Tiếp nhận trực tiếp tại Quầy / Bưu chính
            </button>
          )}
        </div>
      </div>

      {/* Bộ lọc nghiệp vụ */}
      <div className="bg-[#fffdf5] border border-[#d6d3cd] p-4 rounded-[2px] space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4">
            <label className="block font-semibold mb-1">Tìm kiếm Mã HS / Họ tên / CCCD</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#4b5563] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="HS-2026..., họ tên, số CCCD..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#9ca3af] rounded-[2px]"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="block font-semibold mb-1">Trạng thái quy trình</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-[#9ca3af] rounded-[2px]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {Object.entries(DOSSIER_STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block font-semibold mb-1">Cảnh báo hạn giải quyết (SLA)</label>
            <select
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-[#9ca3af] rounded-[2px]"
            >
              <option value="ALL">Tất cả tiến độ SLA</option>
              <option value="QUA_HAN">Đang quá hạn giải quyết</option>
              <option value="SAP_DEN_HAN">Sắp đến hạn (&le; 24h)</option>
              <option value="TRONG_HAN">Đang trong hạn</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex items-end">
            {userRole === "CHUYEN_VIEN" ? (
              <span className="inline-block py-1.5 px-2 bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] font-semibold rounded-[2px]">
                Giới hạn phòng ban (ABAC)
              </span>
            ) : (
              <label className="inline-flex items-center gap-2 py-1.5 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={scopeAll}
                  onChange={(e) => setScopeAll(e.target.checked)}
                  className="w-4 h-4 accent-[#991b1b]"
                />
                Xem toàn đơn vị
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e5e7eb] text-[#4b5563]">
          <span className="tabular-nums">
            Kết quả sổ theo dõi:{" "}
            <strong className="text-[#111827]">{loading ? "..." : dossiers.length}</strong> hồ sơ hành chính
          </span>
          {(q.trim() || statusFilter !== "ALL" || slaFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setStatusFilter("ALL");
                setSlaFilter("ALL");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#991b1b] bg-white border border-[#fca5a5] hover:bg-[#fef2f2] rounded-[2px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu hồ sơ */}
      <div className="border border-[#d6d3cd] rounded-[2px] overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#fffdf5] border-b border-[#d6d3cd] text-left text-[#374151]">
              <th className="px-3.5 py-2.5 font-bold">Mã biên nhận</th>
              <th className="px-3.5 py-2.5 font-bold">Chủ hồ sơ</th>
              <th className="px-3.5 py-2.5 font-bold">Thủ tục &amp; Phòng ban</th>
              <th className="px-3.5 py-2.5 font-bold">Trạng thái &amp; Phí</th>
              <th className="px-3.5 py-2.5 font-bold">Thời hạn SLA</th>
              <th className="px-3.5 py-2.5 font-bold text-right">Tác nghiệp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#4b5563]">
                  Đang tải sổ theo dõi hồ sơ...
                </td>
              </tr>
            ) : dossiers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#4b5563]">
                  Không có hồ sơ nào khớp bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              dossiers.map((d) => (
                <tr key={d.id} className="hover:bg-[#fffdf5]">
                  <td className="px-3.5 py-3 align-top tabular-nums">
                    <Link
                      href={`/he-thong/ho-so/${d.id}`}
                      className="font-bold text-[#991b1b] hover:underline block"
                    >
                      {d.dossierCode}
                    </Link>
                    <span className="text-[11px] text-[#4b5563]">
                      {d.channel === "TRUC_TUYEN"
                        ? "Trực tuyến"
                        : d.channel === "TRUC_TIEP"
                        ? "Tại quầy"
                        : "Bưu chính"}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 align-top">
                    <p className="font-semibold text-[#111827]">{d.applicantName}</p>
                    <p className="text-[#4b5563] tabular-nums">CCCD: {d.applicantCitizenId}</p>
                    <p className="text-[#4b5563] tabular-nums">SĐT: {d.applicantPhone}</p>
                  </td>
                  <td className="px-3.5 py-3 align-top max-w-xs">
                    <p className="font-medium text-[#111827]">
                      [{d.procedure.code}] {d.procedure.name}
                    </p>
                    <p className="text-[11px] text-[#4b5563] mt-0.5">
                      {d.department.name}
                      {d.assignee ? ` • Thụ lý: ${d.assignee.fullName}` : ""}
                    </p>
                  </td>
                  <td className="px-3.5 py-3 align-top space-y-1.5">
                    <div>
                      <DossierStatusBadge status={d.status} />
                    </div>
                    <div>
                      <FeeBadge status={d.feeStatus} amount={d.feeAmount} />
                    </div>
                  </td>
                  <td className="px-3.5 py-3 align-top tabular-nums">
                    <SlaBadge state={d.sla.state} label={d.sla.label} />
                    <p className="text-[11px] text-[#4b5563] mt-1">
                      Nộp: {new Date(d.submittedAt).toLocaleDateString("vi-VN")}
                    </p>
                    {d.dueAt && (
                      <p className="text-[11px] font-medium text-[#111827]">
                        Hẹn trả: {new Date(d.dueAt).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </td>
                  <td className="px-3.5 py-3 align-top text-right">
                    <Link
                      href={`/he-thong/ho-so/${d.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-[#ce1126] hover:bg-[#991b1b] text-white rounded-[2px]"
                    >
                      Mở hồ sơ
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tiếp nhận trực tiếp tại Quầy Một cửa */}
      {showIntakeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="intake-modal-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#111827] w-full max-w-2xl rounded-[2px] overflow-hidden">
            <div className="bg-[#991b1b] text-white px-5 py-3 flex items-center justify-between">
              <h2 id="intake-modal-title" className="text-sm font-bold uppercase font-official-serif">
                Đăng ký Hồ sơ Trực tiếp tại Quầy Một cửa / Bưu chính Công ích
              </h2>
              <button
                type="button"
                onClick={() => setShowIntakeModal(false)}
                className="p-1 hover:bg-white/10 rounded-[2px] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCounterIntakeSubmit} className="p-5 space-y-4 text-xs">
              {intakeError && (
                <div
                  role="alert"
                  className="p-3 bg-[#fef2f2] border border-[#dc2626] text-[#991b1b] font-semibold"
                >
                  {intakeError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block font-semibold mb-1">Thủ tục hành chính *</label>
                  <select
                    value={intakeProcId}
                    onChange={(e) => setIntakeProcId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-[#9ca3af] bg-white rounded-[2px]"
                  >
                    {procedures.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-semibold mb-1">Kênh tiếp nhận *</label>
                  <select
                    value={intakeChannel}
                    onChange={(e) => setIntakeChannel(e.target.value as "TRUC_TIEP" | "BUU_CHINH")}
                    className="w-full px-2.5 py-2 border border-[#9ca3af] bg-white rounded-[2px]"
                  >
                    <option value="TRUC_TIEP">Trực tiếp tại Quầy</option>
                    <option value="BUU_CHINH">Qua Bưu chính công ích</option>
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="block font-semibold mb-1">Họ tên công dân / tổ chức *</label>
                  <input
                    type="text"
                    required
                    value={intakeName}
                    onChange={(e) => setIntakeName(e.target.value)}
                    placeholder="Nguyễn Văn B"
                    className="w-full px-2.5 py-2 border border-[#9ca3af] rounded-[2px]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-semibold mb-1">Số CCCD (12 chữ số) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={intakeCid}
                    onChange={(e) => setIntakeCid(e.target.value)}
                    placeholder="079088001234"
                    className="w-full px-2.5 py-2 border border-[#9ca3af] rounded-[2px] tabular-nums"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-semibold mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={intakePhone}
                    onChange={(e) => setIntakePhone(e.target.value)}
                    placeholder="0909123456"
                    className="w-full px-2.5 py-2 border border-[#9ca3af] rounded-[2px] tabular-nums"
                  />
                </div>

                <div className="sm:col-span-12">
                  <label className="block font-semibold mb-1">Địa chỉ thường trú *</label>
                  <input
                    type="text"
                    required
                    value={intakeAddress}
                    onChange={(e) => setIntakeAddress(e.target.value)}
                    placeholder="Số nhà, đường, khu phố, phường..."
                    className="w-full px-2.5 py-2 border border-[#9ca3af] rounded-[2px]"
                  />
                </div>

                <div className="sm:col-span-12">
                  <label className="block font-semibold mb-1">Nội dung đề nghị giải quyết *</label>
                  <textarea
                    rows={2}
                    required
                    value={intakeSummary}
                    onChange={(e) => setIntakeSummary(e.target.value)}
                    placeholder="Mô tả nội dung yêu cầu của công dân tại quầy..."
                    className="w-full px-2.5 py-2 border border-[#9ca3af] rounded-[2px]"
                  />
                </div>

                <div className="sm:col-span-12 p-2.5 bg-[#f0fdf4] border border-[#86efac] rounded-[2px]">
                  <label className="inline-flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={intakeAutoAccept}
                      onChange={(e) => setIntakeAutoAccept(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#15803d]"
                    />
                    <span>
                      <strong className="text-[#166534] block">
                        Tiếp nhận chính thức ngay &amp; Cấp Giấy hẹn trả kết quả (Mẫu số 01)
                      </strong>
                      <span className="text-[11px] text-[#374151]">
                        Áp dụng theo Điều 17 Nghị định 61/2018/NĐ-CP khi cán bộ Một cửa đã kiểm tra đủ thành phần giấy tờ tại quầy, tự động phân công chuyên viên ít việc nhất và tính hạn SLA ngay trong 01 bước.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 border border-[#9ca3af] rounded-[2px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={intakeSubmitting}
                  className="px-4 py-2 bg-[#991b1b] text-white font-bold rounded-[2px] cursor-pointer"
                >
                  {intakeSubmitting
                    ? "Đang xử lý..."
                    : intakeAutoAccept
                    ? "Tiếp nhận ngay & Cấp Giấy hẹn Mẫu 01"
                    : "Khởi tạo & Chuyển sang Tiếp nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffDossiersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs">Đang tải danh sách hồ sơ...</div>}>
      <StaffDossiersListContent />
    </Suspense>
  );
}
