"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BookMarked,
  CheckCircle2,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

interface RequiredDocSpec {
  code: string;
  name: string;
  mandatory: boolean;
}

interface ProcedureItem {
  id: string;
  code: string;
  name: string;
  field: string;
  serviceLevel: "MOT_PHAN" | "TOAN_TRINH";
  processingDays: number;
  processingHours: number;
  feeAmount: number;
  feePerCopy: boolean;
  feeExemptionNote: string | null;
  legalBasis: string;
  executionSteps: string;
  resultTemplate: string;
  isActive: boolean;
  requiredDocs: RequiredDocSpec[];
  department: { id: string; code: string; name: string };
  _count?: { dossiers: number };
}

interface DepartmentItem {
  id: string;
  code: string;
  name: string;
}

export default function InternalProceduresPage() {
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal công bố mới TTHC (dành cho QUAN_TRI)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [code, setCode] = useState("TTHC-TP-09");
  const [name, setName] = useState("");
  const [field, setField] = useState("Tư pháp - Hộ tịch");
  const [serviceLevel, setServiceLevel] = useState<"MOT_PHAN" | "TOAN_TRINH">("TOAN_TRINH");
  const [processingDays, setProcessingDays] = useState(3);
  const [processingHours, setProcessingHours] = useState(24);
  const [feeAmount, setFeeAmount] = useState(0);
  const [feePerCopy, setFeePerCopy] = useState(false);
  const [feeExemptionNote, setFeeExemptionNote] = useState(
    "Miễn lệ phí đối với người có công, hộ nghèo, người khuyết tật."
  );
  const [legalBasis, setLegalBasis] = useState("");
  const [executionSteps, setExecutionSteps] = useState(
    "Bước 1: Nộp hồ sơ trực tuyến hoặc tại Quầy Một cửa -> Bước 2: Thẩm định chuyên môn -> Bước 3: Lãnh đạo ký số -> Bước 4: Trả kết quả."
  );
  const [resultTemplate, setResultTemplate] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocSpec[]>([
    { code: "TK-01", name: "Tờ khai theo mẫu quy định", mandatory: true },
    { code: "CCCD-01", name: "Bản chính hoặc bản điện tử Căn cước công dân", mandatory: true },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Modal hiệu chỉnh / tạm ngưng TTHC (dành cho QUAN_TRI)
  const [editingProc, setEditingProc] = useState<ProcedureItem | null>(null);
  const [editServiceLevel, setEditServiceLevel] = useState<"MOT_PHAN" | "TOAN_TRINH">("TOAN_TRINH");
  const [editDays, setEditDays] = useState(3);
  const [editHours, setEditHours] = useState(24);
  const [editFee, setEditFee] = useState(0);
  const [editFeePerCopy, setEditFeePerCopy] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadProcedures = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("all", "1");
      if (fieldFilter !== "ALL") params.set("field", fieldFilter);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const res = await fetch(`/api/procedures?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProcedures(data.procedures || []);
      }
    } catch {
      setErrorMsg("Không thể tải danh mục Thủ tục hành chính.");
    } finally {
      setLoading(false);
    }
  }, [fieldFilter, searchQuery]);

  useEffect(() => {
    loadProcedures();
  }, [loadProcedures]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/metadata").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([meta, me]) => {
        if (meta?.departments) {
          setDepartments(meta.departments);
          if (meta.departments[0]) setDepartmentId(meta.departments[0].id);
        }
        if (me?.user?.role) setUserRole(me.user.role);
      })
      .catch(() => {});
  }, []);

  function openEditModal(proc: ProcedureItem) {
    setEditingProc(proc);
    setErrorMsg("");
    setEditServiceLevel(proc.serviceLevel);
    setEditDays(proc.processingDays);
    setEditHours(proc.processingHours);
    setEditFee(proc.feeAmount);
    setEditFeePerCopy(Boolean(proc.feePerCopy));
    setEditIsActive(proc.isActive);
  }

  function addDocRow() {
    setRequiredDocs((prev) => [
      ...prev,
      { code: `TL-0${prev.length + 1}`, name: "", mandatory: true },
    ]);
  }

  function removeDocRow(idx: number) {
    setRequiredDocs((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleCreateProcedure(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setFeedback("");

    try {
      const res = await fetch("/api/procedures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          field,
          serviceLevel,
          processingDays,
          processingHours,
          feeAmount,
          feePerCopy,
          feeExemptionNote,
          legalBasis,
          executionSteps,
          resultTemplate,
          departmentId,
          requiredDocs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể công bố mới Thủ tục hành chính.");
        return;
      }

      setFeedback(`Đã ban hành và niêm yết công khai thủ tục [${data.procedure.code}] thành công.`);
      setShowCreateModal(false);
      setName("");
      setLegalBasis("");
      setResultTemplate("");
      await loadProcedures();
    } catch {
      setErrorMsg("Lỗi kết nối khi lưu Thủ tục hành chính.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateProcedure(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProc) return;
    setSubmittingEdit(true);
    setErrorMsg("");
    setFeedback("");

    try {
      const res = await fetch("/api/procedures", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProc.id,
          serviceLevel: editServiceLevel,
          processingDays: editDays,
          processingHours: editHours,
          feeAmount: editFee,
          feePerCopy: editFeePerCopy,
          isActive: editIsActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể cập nhật định mức TTHC.");
        return;
      }

      setFeedback(
        `Đã cập nhật cấu hình TTHC [${data.procedure.code}] (${
          data.procedure.isActive ? "Đang áp dụng" : "Tạm ngưng tiếp nhận"
        }).`
      );
      setEditingProc(null);
      await loadProcedures();
    } catch {
      setErrorMsg("Lỗi kết nối khi cập nhật Thủ tục hành chính.");
    } finally {
      setSubmittingEdit(false);
    }
  }

  const fields = Array.from(new Set(procedures.map((p) => p.field)));
  const hasFilters = fieldFilter !== "ALL" || searchQuery.trim().length > 0;
  const colCount = userRole === "QUAN_TRI" ? 8 : 7;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#d6d3cd]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
            Cơ sở dữ liệu Nội bộ về Thủ tục hành chính chuẩn hóa
          </p>
          <h1 className="text-xl font-bold text-[#111827] font-official-serif mt-0.5">
            Quản trị Danh mục Thủ tục Hành chính &amp; Định mức Thời hạn SLA
          </h1>
        </div>

        {userRole === "QUAN_TRI" && (
          <button
            type="button"
            onClick={() => {
              setErrorMsg("");
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-[#991b1b] text-white hover:bg-[#7f1d1d] rounded-[2px] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Công bố Thủ tục Hành chính mới
          </button>
        )}
      </div>

      {feedback && (
        <div
          role="status"
          className="p-3 bg-[#f0fdf4] border border-[#16a34a] text-[#166534] text-xs font-semibold flex items-center gap-2 rounded-[2px]"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
      {errorMsg && !showCreateModal && !editingProc && (
        <div
          role="alert"
          className="p-3 bg-[#fef2f2] border border-[#dc2626] text-[#991b1b] text-xs font-semibold flex items-center gap-2 rounded-[2px]"
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Thanh tra cứu */}
      <div className="bg-[#fff8dc] p-3.5 border border-[#d6d3cd] rounded-[2px] text-xs space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              aria-label="Lọc theo lĩnh vực TTHC"
              className="w-full border border-[#9ca3af] bg-white px-2.5 py-2 rounded-[2px]"
            >
              <option value="ALL">Tất cả lĩnh vực chuyên môn</option>
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-[#4b5563] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã TTHC, tên thủ tục, lĩnh vực giải quyết..."
              className="w-full border border-[#9ca3af] bg-white pl-8 pr-3 py-2 rounded-[2px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#4b5563]">
          <span>
            Hiển thị <strong className="text-[#111827] tabular-nums">{procedures.length}</strong> thủ tục hành chính
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setFieldFilter("ALL");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1 font-semibold text-[#991b1b] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng Danh mục TTHC */}
      <div className="border border-[#d6d3cd] rounded-[2px] overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#fff8dc] border-b border-[#d6d3cd] text-[#991b1b]">
              <th className="py-2.5 px-3 text-left">Mã TTHC</th>
              <th className="py-2.5 px-3 text-left">Tên Thủ tục &amp; Căn cứ pháp lý</th>
              <th className="py-2.5 px-3 text-left">Đơn vị thụ lý</th>
              <th className="py-2.5 px-3 text-center">Mức độ / Niêm yết</th>
              <th className="py-2.5 px-3 text-center">Định mức SLA</th>
              <th className="py-2.5 px-3 text-right">Lệ phí</th>
              <th className="py-2.5 px-3 text-center">Hồ sơ</th>
              {userRole === "QUAN_TRI" && (
                <th className="py-2.5 px-3 text-right">Cấu hình</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {loading ? (
              <tr>
                <td colSpan={colCount} className="py-8 text-center text-[#4b5563]">
                  Đang tải Danh mục Thủ tục hành chính...
                </td>
              </tr>
            ) : procedures.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-8 text-center text-[#4b5563]">
                  Không tìm thấy Thủ tục hành chính nào khớp điều kiện tra cứu.
                </td>
              </tr>
            ) : (
              procedures.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-[#fafaf9] align-top ${!p.isActive ? "bg-[#f9fafb] opacity-80" : ""}`}
                >
                  <td className="py-3 px-3 font-bold text-[#991b1b] whitespace-nowrap tabular-nums">
                    {p.code}
                  </td>
                  <td className="py-3 px-3 max-w-md">
                    <p className="font-bold text-[#111827]">{p.name}</p>
                    <p className="text-[#4b5563] mt-0.5">Căn cứ: {p.legalBasis}</p>
                    <p className="text-[11px] text-[#991b1b] mt-1">
                      Thành phần bắt buộc:{" "}
                      {p.requiredDocs.filter((d) => d.mandatory).length}/
                      {p.requiredDocs.length} giấy tờ • Kết quả: {p.resultTemplate}
                    </p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-[#111827]">{p.department.name}</p>
                    <p className="text-[#4b5563]">{p.field}</p>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap space-y-1">
                    <span
                      className={`inline-block px-2 py-0.5 font-semibold border rounded-[2px] ${
                        p.serviceLevel === "TOAN_TRINH"
                          ? "bg-[#dcfce7] text-[#166534] border-[#86efac]"
                          : "bg-[#fef3c7] text-[#92400e] border-[#f59e0b]"
                      }`}
                    >
                      {p.serviceLevel === "TOAN_TRINH" ? "Toàn trình" : "Một phần"}
                    </span>
                    <span
                      className={`block text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] border ${
                        p.isActive
                          ? "bg-[#f0fdf4] text-[#166534] border-[#86efac]"
                          : "bg-[#fef2f2] text-[#991b1b] border-[#fca5a5]"
                      }`}
                    >
                      {p.isActive ? "Đang áp dụng" : "Tạm ngưng"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums whitespace-nowrap font-semibold">
                    {p.processingDays === 0
                      ? `Trong ngày (${p.processingHours}h)`
                      : `${p.processingDays} ngày LV`}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap font-semibold">
                    {p.feeAmount === 0
                      ? "Miễn phí"
                      : `${p.feeAmount.toLocaleString("vi-VN")} đ${p.feePerCopy ? "/bản" : ""}`}
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums font-bold text-[#991b1b]">
                    {p._count?.dossiers ?? 0}
                  </td>
                  {userRole === "QUAN_TRI" && (
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold border border-[#ce1126] text-[#991b1b] bg-white hover:bg-[#991b1b] hover:text-white rounded-[2px] cursor-pointer transition-colors"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        Hiệu chỉnh
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Công bố mới TTHC */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#111827] w-full max-w-3xl rounded-[2px] shadow-xl my-8"
          >
            <div className="bg-[#991b1b] text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-[#fde68a]" />
                <h2 className="text-sm font-bold uppercase">
                  Công bố mới Thủ tục Hành chính vào Danh mục Niêm yết
                </h2>
              </div>
              <button
                type="button"
                aria-label="Đóng cửa sổ công bố TTHC"
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-white/20 rounded-[2px] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProcedure} className="p-5 space-y-3.5 text-xs">
              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 bg-[#fef2f2] border border-[#dc2626] text-[#991b1b] font-semibold flex items-center gap-2 rounded-[2px]"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Mã TTHC *:</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px] font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Lĩnh vực chuyên môn *:</label>
                  <input
                    type="text"
                    required
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Phòng ban thụ lý chính *:</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Tên Thủ tục hành chính *:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Cấp bản sao trích lục hộ tịch từ Sổ hộ tịch..."
                  className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold mb-1">Mức độ DVC:</label>
                  <select
                    value={serviceLevel}
                    onChange={(e) =>
                      setServiceLevel(e.target.value as "MOT_PHAN" | "TOAN_TRINH")
                    }
                    className="w-full border border-[#9ca3af] px-2 py-2 rounded-[2px]"
                  >
                    <option value="TOAN_TRINH">Toàn trình</option>
                    <option value="MOT_PHAN">Một phần</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Số ngày làm việc:</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={processingDays}
                    onChange={(e) => setProcessingDays(Number(e.target.value))}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tổng số giờ SLA:</label>
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={processingHours}
                    onChange={(e) => setProcessingHours(Number(e.target.value))}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Lệ phí (VNĐ):</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(Number(e.target.value))}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px] tabular-nums"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 font-semibold text-[#991b1b] cursor-pointer">
                <input
                  type="checkbox"
                  checked={feePerCopy}
                  onChange={(e) => setFeePerCopy(e.target.checked)}
                  className="accent-[#991b1b]"
                />
                Nhân lệ phí theo số lượng bản đăng ký nhận kết quả (áp dụng cho Sao y / Chứng thực)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Căn cứ pháp lý *:</label>
                  <input
                    type="text"
                    required
                    value={legalBasis}
                    onChange={(e) => setLegalBasis(e.target.value)}
                    placeholder="VD: Luật Hộ tịch 2014; Nghị định 123/2015/NĐ-CP..."
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tên Biểu mẫu Kết quả đầu ra *:</label>
                  <input
                    type="text"
                    required
                    value={resultTemplate}
                    onChange={(e) => setResultTemplate(e.target.value)}
                    placeholder="VD: Bản sao Trích lục hộ tịch"
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Trình tự thực hiện *:</label>
                <textarea
                  rows={2}
                  required
                  value={executionSteps}
                  onChange={(e) => setExecutionSteps(e.target.value)}
                  className="w-full border border-[#9ca3af] p-2 rounded-[2px]"
                />
              </div>

              {/* Thành phần hồ sơ */}
              <div className="space-y-2 p-3 bg-[#fff8dc] border border-[#d6d3cd]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#991b1b]">
                    Thành phần giấy tờ yêu cầu ({requiredDocs.length} mục):
                  </span>
                  <button
                    type="button"
                    onClick={addDocRow}
                    className="px-2 py-1 bg-[#ce1126] text-white font-semibold rounded-[2px] cursor-pointer"
                  >
                    + Thêm thành phần
                  </button>
                </div>
                {requiredDocs.map((doc, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      required
                      value={doc.code}
                      onChange={(e) =>
                        setRequiredDocs((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, code: e.target.value } : item
                          )
                        )
                      }
                      placeholder="Mã"
                      className="col-span-3 border border-[#9ca3af] bg-white px-2 py-1.5 rounded-[2px]"
                    />
                    <input
                      type="text"
                      required
                      value={doc.name}
                      onChange={(e) =>
                        setRequiredDocs((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, name: e.target.value } : item
                          )
                        )
                      }
                      placeholder="Tên thành phần giấy tờ..."
                      className="col-span-6 border border-[#9ca3af] bg-white px-2 py-1.5 rounded-[2px]"
                    />
                    <label className="col-span-2 flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={doc.mandatory}
                        onChange={(e) =>
                          setRequiredDocs((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, mandatory: e.target.checked }
                                : item
                            )
                          )
                        }
                        className="accent-[#991b1b]"
                      />
                      <span>Bắt buộc</span>
                    </label>
                    <button
                      type="button"
                      disabled={requiredDocs.length <= 1}
                      onClick={() => removeDocRow(idx)}
                      className="col-span-1 text-[#b91c1c] disabled:opacity-30 cursor-pointer flex justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#9ca3af] rounded-[2px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#991b1b] text-white font-bold rounded-[2px] cursor-pointer"
                >
                  {submitting ? "Đang công bố..." : "Ban hành & Niêm yết Công khai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hiệu chỉnh Định mức & Trạng thái TTHC */}
      {editingProc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#111827] w-full max-w-lg rounded-[2px] shadow-xl"
          >
            <div className="bg-[#ce1126] text-white px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#fde68a] font-semibold">Mã TTHC: {editingProc.code}</p>
                <h2 className="text-sm font-bold uppercase">
                  Hiệu chỉnh Định mức SLA, Lệ phí &amp; Trạng thái Niêm yết
                </h2>
              </div>
              <button
                type="button"
                aria-label="Đóng cửa sổ hiệu chỉnh TTHC"
                onClick={() => setEditingProc(null)}
                className="p-1 hover:bg-white/20 rounded-[2px] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProcedure} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 bg-[#fef2f2] border border-[#dc2626] text-[#991b1b] font-semibold flex items-center gap-2 rounded-[2px]"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3 bg-[#fff8dc] border border-[#d6d3cd]">
                <p className="font-bold text-[#111827]">{editingProc.name}</p>
                <p className="text-[#4b5563] mt-0.5">{editingProc.department.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Mức độ DVC:</label>
                  <select
                    value={editServiceLevel}
                    onChange={(e) => setEditServiceLevel(e.target.value as "MOT_PHAN" | "TOAN_TRINH")}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                  >
                    <option value="TOAN_TRINH">Toàn trình</option>
                    <option value="MOT_PHAN">Một phần</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Trạng thái tiếp nhận:</label>
                  <select
                    value={editIsActive ? "ACTIVE" : "INACTIVE"}
                    onChange={(e) => setEditIsActive(e.target.value === "ACTIVE")}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px] font-semibold"
                  >
                    <option value="ACTIVE">Đang áp dụng công khai</option>
                    <option value="INACTIVE">Tạm ngưng tiếp nhận</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Số ngày làm việc:</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={editDays}
                    onChange={(e) => setEditDays(Number(e.target.value))}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tổng số giờ SLA:</label>
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={editHours}
                    onChange={(e) => setEditHours(Number(e.target.value))}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px] tabular-nums"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold mb-1">Mức lệ phí niêm yết (VNĐ):</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editFee}
                    onChange={(e) => setEditFee(Number(e.target.value))}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px] tabular-nums"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 font-semibold text-[#991b1b] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFeePerCopy}
                  onChange={(e) => setEditFeePerCopy(e.target.checked)}
                  className="accent-[#991b1b]"
                />
                Nhân lệ phí theo số lượng bản đăng ký nhận kết quả
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setEditingProc(null)}
                  className="px-4 py-2 border border-[#9ca3af] rounded-[2px] cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 bg-[#991b1b] text-white font-bold rounded-[2px] cursor-pointer"
                >
                  {submittingEdit ? "Đang lưu..." : "Lưu Cấu hình TTHC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
