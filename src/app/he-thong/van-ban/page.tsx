"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FilePlus2,
  FileSignature,
  Lock,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import { downloadOfficialCsv } from "@/lib/csv-export";

interface DepartmentItem {
  id: string;
  code: string;
  name: string;
}

interface StaffItem {
  id: string;
  fullName: string;
  role: string;
  positionTitle: string | null;
  departmentId: string | null;
}

interface OfficialDocItem {
  id: string;
  direction: "DEN" | "DI";
  incomingNumber: number | null;
  outgoingNumber: number | null;
  documentSymbol: string;
  docType: string;
  urgency: string;
  security: "THUONG" | "MAT" | "TOI_MAT";
  status: string;
  title: string;
  contentSummary: string;
  issuingAgency: string;
  recipientAgency: string;
  signerName: string | null;
  signerTitle: string | null;
  issuedDate: string;
  receivedDate: string | null;
  processingDeadline: string | null;
  directiveNote: string | null;
  resolutionNote: string | null;
  leadDepartment: { id: string; code: string; name: string } | null;
  assignee: { id: string; fullName: string; positionTitle: string | null } | null;
  linkedDossier: { id: string; dossierCode: string; applicantName: string } | null;
}

type DocActionType =
  | "BUT_PHE_PHAN_CONG"
  | "CAP_NHAT_XU_LY"
  | "KY_BAN_HANH"
  | "TRA_LAI_DU_THAO"
  | "LUU_TRU";

const DOC_STATUS_LABELS: Record<string, { label: string; style: string }> = {
  CHO_BUT_PHE: {
    label: "Chờ Lãnh đạo bút phê",
    style: "bg-[#fef3c7] text-[#92400e] border-[#f59e0b]",
  },
  DANG_XU_LY: {
    label: "Đang xử lý chuyên môn",
    style: "bg-[#dbeafe] text-[#1e40af] border-[#3b82f6]",
  },
  CHO_KY_BAN_HANH: {
    label: "Dự thảo chờ ký số",
    style: "bg-[#ffedd5] text-[#9a3412] border-[#ea580c]",
  },
  DA_BAN_HANH: {
    label: "Đã ký & đóng dấu ban hành",
    style: "bg-[#dcfce7] text-[#166534] border-[#16a34a]",
  },
  LUU_TRU: {
    label: "Đã hoàn tất & Lưu trữ",
    style: "bg-[#f3f4f6] text-[#374151] border-[#9ca3af]",
  },
};

const URGENCY_LABELS: Record<string, string> = {
  THUONG: "Thường",
  KHAN: "Khẩn",
  THUONG_KHAN: "Thượng khẩn",
  HOA_TOC: "Hỏa tốc",
};

const SECURITY_LABELS: Record<string, string> = {
  THUONG: "Thường",
  MAT: "MẬT",
  TOI_MAT: "TỐI MẬT",
};

export default function OfficialDocumentsPage() {
  const [documents, setDocuments] = useState<OfficialDocItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffItem[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  const [directionFilter, setDirectionFilter] = useState<"ALL" | "DEN" | "DI">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal tạo văn bản mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDirection, setNewDirection] = useState<"DEN" | "DI">("DEN");
  const [newSymbol, setNewSymbol] = useState("");
  const [newDocType, setNewDocType] = useState("CONG_VAN");
  const [newUrgency, setNewUrgency] = useState("THUONG");
  const [newSecurity, setNewSecurity] = useState<"THUONG" | "MAT" | "TOI_MAT">("THUONG");
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newIssuingAgency, setNewIssuingAgency] = useState("UBND Quận Tân Bình");
  const [newRecipientAgency, setNewRecipientAgency] = useState("UBND Phường Tân Bình");
  const [newIssuedDate, setNewIssuedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [newDeadline, setNewDeadline] = useState("");
  const [newDeptId, setNewDeptId] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Modal điều hành / bút phê / ký ban hành
  const [activeDoc, setActiveDoc] = useState<OfficialDocItem | null>(null);
  const [docAction, setDocAction] = useState<DocActionType>("BUT_PHE_PHAN_CONG");
  const [directiveNote, setDirectiveNote] = useState("");
  const [leadDepartmentId, setLeadDepartmentId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("Chủ tịch UBND Phường");
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (directionFilter !== "ALL") params.set("direction", directionFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/documents?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
      }
    } catch {
      setErrorMsg("Không thể tải Sổ Quản lý Văn bản Điều hành.");
    } finally {
      setLoading(false);
    }
  }, [directionFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/metadata").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([meta, me]) => {
        if (meta?.departments) setDepartments(meta.departments);
        if (meta?.staffUsers) setStaffUsers(meta.staffUsers);
        if (me?.user?.role) setCurrentUserRole(me.user.role);
        if (me?.user?.fullName) setSignerName(me.user.fullName);
      })
      .catch(() => {});
  }, []);

  function getAvailableActions(doc: OfficialDocItem): Array<{ value: DocActionType; label: string }> {
    if (doc.direction === "DEN") {
      const opts: Array<{ value: DocActionType; label: string }> = [];
      if (doc.status !== "LUU_TRU") {
        opts.push({
          value: "BUT_PHE_PHAN_CONG",
          label: "Bút phê chỉ đạo & Phân công xử lý (Lãnh đạo / Quản trị)",
        });
      }
      if (doc.status === "DANG_XU_LY" || doc.status === "CHO_BUT_PHE") {
        opts.push({
          value: "CAP_NHAT_XU_LY",
          label: "Báo cáo hoàn tất xử lý & Lưu hồ sơ văn bản đến",
        });
      }
      if (doc.status !== "LUU_TRU") {
        opts.push({
          value: "LUU_TRU",
          label: "Đưa vào hồ sơ Lưu trữ cơ quan",
        });
      }
      return opts;
    }

    // Văn bản Đi (DI)
    const opts: Array<{ value: DocActionType; label: string }> = [];
    if (doc.status === "CHO_KY_BAN_HANH") {
      opts.push({
        value: "KY_BAN_HANH",
        label: "Ký số & Cấp số đóng dấu ban hành Văn bản đi (Lãnh đạo / Quản trị)",
      });
      opts.push({
        value: "TRA_LAI_DU_THAO",
        label: "Trả lại dự thảo để chuyên viên chỉnh sửa (Lãnh đạo / Quản trị)",
      });
    }
    if (doc.status === "DANG_XU_LY") {
      opts.push({
        value: "CAP_NHAT_XU_LY",
        label: "Hoàn thiện dự thảo & Trình ký lại Lãnh đạo",
      });
    }
    if (doc.status !== "LUU_TRU") {
      opts.push({
        value: "LUU_TRU",
        label: "Đưa vào hồ sơ Lưu trữ cơ quan",
      });
    }
    return opts;
  }

  function openActionModal(doc: OfficialDocItem) {
    setActiveDoc(doc);
    setErrorMsg("");
    setDirectiveNote(doc.directiveNote || "");
    setLeadDepartmentId(doc.leadDepartment?.id || departments[0]?.id || "");
    setAssigneeId(doc.assignee?.id || "");
    setResolutionNote(doc.resolutionNote || "");

    const opts = getAvailableActions(doc);
    if (opts[0]) {
      setDocAction(opts[0].value);
    }
  }

  async function handleCreateDocument(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingCreate(true);
    setErrorMsg("");
    setFeedback("");

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: newDirection,
          documentSymbol: newSymbol,
          docType: newDocType,
          urgency: newUrgency,
          security: newSecurity,
          title: newTitle,
          contentSummary: newSummary,
          issuingAgency: newIssuingAgency,
          recipientAgency: newRecipientAgency,
          issuedDate: newIssuedDate,
          processingDeadline: newDeadline || undefined,
          leadDepartmentId: newDeptId || undefined,
          assigneeId: newAssigneeId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể ghi sổ văn bản mới.");
        return;
      }

      setFeedback(
        `Đã vào sổ thành công văn bản số hiệu ${data.document.documentSymbol}${
          data.document.incomingNumber
            ? ` (Số đến #${data.document.incomingNumber})`
            : data.document.outgoingNumber
            ? ` (Số đi #${data.document.outgoingNumber})`
            : ""
        }.`
      );
      setShowCreateModal(false);
      setNewSymbol("");
      setNewTitle("");
      setNewSummary("");
      setNewSecurity("THUONG");
      setNewAssigneeId("");
      await loadDocuments();
    } catch {
      setErrorMsg("Lỗi kết nối khi đăng ký văn bản.");
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleUpdateDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDoc) return;
    setSubmittingAction(true);
    setErrorMsg("");
    setFeedback("");

    try {
      const res = await fetch(`/api/documents/${activeDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: docAction,
          directiveNote: directiveNote.trim() || undefined,
          leadDepartmentId: leadDepartmentId || undefined,
          assigneeId: assigneeId || undefined,
          resolutionNote: resolutionNote.trim() || undefined,
          signerName: signerName.trim() || undefined,
          signerTitle: signerTitle.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể cập nhật điều hành văn bản.");
        return;
      }

      setFeedback(
        `Đã cập nhật điều hành văn bản [${activeDoc.documentSymbol}]${
          data.document?.outgoingNumber ? ` (Số đi #${data.document.outgoingNumber})` : ""
        } thành công.`
      );
      setActiveDoc(null);
      await loadDocuments();
    } catch {
      setErrorMsg("Lỗi kết nối khi cập nhật văn bản.");
    } finally {
      setSubmittingAction(false);
    }
  }

  const filteredSpecialists = staffUsers.filter(
    (u) =>
      u.role === "CHUYEN_VIEN" &&
      (!leadDepartmentId || u.departmentId === leadDepartmentId)
  );

  const createModalSpecialists = staffUsers.filter(
    (u) => u.role === "CHUYEN_VIEN" && (!newDeptId || u.departmentId === newDeptId)
  );

  const hasFilters =
    directionFilter !== "ALL" || statusFilter !== "ALL" || searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Đầu trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#d6d3cd]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
            Công tác Văn thư - Lưu trữ theo Nghị định 30/2020/NĐ-CP
          </p>
          <h1 className="text-xl font-bold text-[#111827] font-official-serif mt-0.5">
            Sổ Quản lý Văn bản Đến, Văn bản Đi &amp; Bút phê Điều hành
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={documents.length === 0}
            onClick={() =>
              downloadOfficialCsv(
                `SoVanBan_DieuHanh_${new Date().toISOString().slice(0, 10)}.csv`,
                [
                  "Luồng VB",
                  "Số sổ (Đến/Đi)",
                  "Số ký hiệu",
                  "Độ mật",
                  "Độ khẩn",
                  "Trích yếu",
                  "Cơ quan ban hành",
                  "Nơi nhận",
                  "Đơn vị chủ trì",
                  "Chuyên viên thụ lý",
                  "Trạng thái",
                  "Ngày văn bản",
                ],
                documents.map((doc) => [
                  doc.direction === "DEN" ? "Văn bản Đến" : "Văn bản Đi",
                  doc.direction === "DEN"
                    ? doc.incomingNumber || ""
                    : doc.outgoingNumber || "Dự thảo",
                  doc.documentSymbol,
                  SECURITY_LABELS[doc.security] || doc.security,
                  URGENCY_LABELS[doc.urgency] || doc.urgency,
                  doc.title,
                  doc.issuingAgency,
                  doc.recipientAgency,
                  doc.leadDepartment?.name || "Văn phòng UBND",
                  doc.assignee?.fullName || "",
                  DOC_STATUS_LABELS[doc.status]?.label || doc.status,
                  new Date(doc.issuedDate).toLocaleDateString("vi-VN"),
                ])
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-[#1e3a5f] text-[#1e3a5f] bg-white hover:bg-[#f0f4f8] disabled:opacity-50 rounded-[2px] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Xuất Sổ CSV (Excel)
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMsg("");
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-[#991b1b] text-white hover:bg-[#7f1d1d] rounded-[2px] cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            Vào sổ Văn bản đến / Dự thảo Văn bản đi
          </button>
        </div>
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
      {errorMsg && !showCreateModal && !activeDoc && (
        <div
          role="alert"
          className="p-3 bg-[#fef2f2] border border-[#dc2626] text-[#991b1b] text-xs font-semibold flex items-center gap-2 rounded-[2px]"
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bộ lọc Luồng văn bản */}
      <div className="bg-[#f4f1ea] p-3.5 border border-[#d6d3cd] rounded-[2px] text-xs space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 flex gap-1.5">
            {[
              { key: "ALL", label: "Toàn bộ Sổ" },
              { key: "DEN", label: "Sổ Văn bản Đến" },
              { key: "DI", label: "Sổ Văn bản Đi" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDirectionFilter(tab.key as "ALL" | "DEN" | "DI")}
                className={`flex-1 py-2 px-2.5 font-bold rounded-[2px] border cursor-pointer ${
                  directionFilter === tab.key
                    ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                    : "bg-white text-[#374151] border-[#d6d3cd] hover:bg-[#eae5da]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái xử lý văn bản"
              className="w-full h-full border border-[#9ca3af] bg-white px-2.5 py-2 rounded-[2px]"
            >
              <option value="ALL">Tất cả trạng thái điều hành</option>
              <option value="CHO_BUT_PHE">Chờ Lãnh đạo bút phê</option>
              <option value="DANG_XU_LY">Đang xử lý chuyên môn</option>
              <option value="CHO_KY_BAN_HANH">Dự thảo chờ ký ban hành</option>
              <option value="DA_BAN_HANH">Đã ký &amp; đóng dấu ban hành</option>
              <option value="LUU_TRU">Đã lưu trữ hồ sơ công việc</option>
            </select>
          </div>

          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#4b5563] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tra cứu số ký hiệu, trích yếu, cơ quan ban hành..."
              className="w-full border border-[#9ca3af] bg-white pl-8 pr-3 py-2 rounded-[2px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#4b5563]">
          <span>
            Hiển thị <strong className="text-[#111827] tabular-nums">{documents.length}</strong> văn bản được phân quyền truy cập
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setDirectionFilter("ALL");
                setStatusFilter("ALL");
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

      {/* Bảng Sổ đăng ký văn bản */}
      <div className="border border-[#d6d3cd] rounded-[2px] overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#f4f1ea] border-b border-[#d6d3cd] text-[#1e3a5f]">
              <th className="py-2.5 px-3 text-left">Luồng / Số sổ</th>
              <th className="py-2.5 px-3 text-left">Số ký hiệu &amp; Ngày BH</th>
              <th className="py-2.5 px-3 text-left">Trích yếu nội dung &amp; Chỉ đạo điều hành</th>
              <th className="py-2.5 px-3 text-left">Đơn vị chủ trì / Liên thông</th>
              <th className="py-2.5 px-3 text-left">Trạng thái</th>
              <th className="py-2.5 px-3 text-right">Tác nghiệp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#4b5563]">
                  Đang tải Sổ đăng ký văn bản hành chính...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#4b5563]">
                  Không có văn bản nào khớp điều kiện lọc hiện tại.
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const st = DOC_STATUS_LABELS[doc.status] || {
                  label: doc.status,
                  style: "bg-gray-100 text-gray-800 border-gray-300",
                };
                const availableActions = getAvailableActions(doc);
                return (
                  <tr key={doc.id} className="hover:bg-[#fafaf9] align-top">
                    <td className="py-3 px-3 whitespace-nowrap tabular-nums">
                      {doc.direction === "DEN" ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[#991b1b]">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          VB ĐẾN #{doc.incomingNumber || "---"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-[#1e3a5f]">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          VB ĐI {doc.outgoingNumber ? `#${doc.outgoingNumber}` : "(Dự thảo)"}
                        </span>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.security !== "THUONG" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-[#111827] text-[#fde68a] border border-[#111827] rounded-[2px]">
                            <Lock className="w-2.5 h-2.5" />
                            {SECURITY_LABELS[doc.security] || doc.security}
                          </span>
                        )}
                        {doc.urgency !== "THUONG" && (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-[#fef2f2] text-[#b91c1c] border border-[#ef4444] rounded-[2px]">
                            {URGENCY_LABELS[doc.urgency] || doc.urgency}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap tabular-nums">
                      <p className="font-bold text-[#111827]">{doc.documentSymbol}</p>
                      <p className="text-[#4b5563] mt-0.5">
                        Ngày BH: {new Date(doc.issuedDate).toLocaleDateString("vi-VN")}
                      </p>
                      <p className="text-[11px] text-[#4b5563] mt-0.5">
                        {doc.direction === "DEN"
                          ? `Từ: ${doc.issuingAgency}`
                          : `Nơi nhận: ${doc.recipientAgency}`}
                      </p>
                    </td>

                    <td className="py-3 px-3 max-w-md">
                      <p className="font-bold text-[#111827]">{doc.title}</p>
                      <p className="text-[#4b5563] mt-0.5">{doc.contentSummary}</p>
                      {doc.directiveNote && (
                        <p className="mt-1.5 p-1.5 bg-[#fefce8] border-l-2 border-[#d97706] text-[#78350f]">
                          <strong>Chỉ đạo Lãnh đạo:</strong> {doc.directiveNote}
                        </p>
                      )}
                      {doc.resolutionNote && (
                        <p className="mt-1 p-1.5 bg-[#f0fdf4] border-l-2 border-[#16a34a] text-[#166534]">
                          <strong>Kết quả thực hiện:</strong> {doc.resolutionNote}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-semibold text-[#111827]">
                        {doc.leadDepartment?.name || "Văn phòng UBND"}
                      </p>
                      {doc.assignee && (
                        <p className="text-[#4b5563] mt-0.5">
                          Thụ lý: {doc.assignee.fullName}
                        </p>
                      )}
                      {doc.signerName && (
                        <p className="text-[#166534] font-medium mt-0.5">
                          Người ký: {doc.signerName}
                        </p>
                      )}
                      {doc.linkedDossier && (
                        <Link
                          href={`/he-thong/ho-so/${doc.linkedDossier.id}`}
                          className="inline-block mt-1 text-[11px] font-bold text-[#991b1b] underline"
                        >
                          Hồ sơ: {doc.linkedDossier.dossierCode}
                        </Link>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 font-semibold border rounded-[2px] ${st.style}`}
                      >
                        {st.label}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {availableActions.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => openActionModal(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold border border-[#1e3a5f] text-[#1e3a5f] bg-white hover:bg-[#1e3a5f] hover:text-white rounded-[2px] cursor-pointer transition-colors"
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                          Điều hành
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#4b5563]">Đã lưu trữ</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Vào sổ văn bản đến / Dự thảo văn bản đi */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#111827] w-full max-w-2xl rounded-[2px] shadow-xl my-8"
          >
            <div className="bg-[#991b1b] text-white px-5 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase">
                Đăng ký Văn bản Hành chính Mới (NĐ 30/2020/NĐ-CP)
              </h2>
              <button
                type="button"
                aria-label="Đóng cửa sổ đăng ký văn bản"
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-white/20 rounded-[2px] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-5 space-y-3.5 text-xs">
              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 bg-[#fef2f2] border border-[#dc2626] text-[#991b1b] font-semibold flex items-center gap-2 rounded-[2px]"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Sổ đăng ký *:</label>
                  <select
                    value={newDirection}
                    onChange={(e) => {
                      const dir = e.target.value as "DEN" | "DI";
                      setNewDirection(dir);
                      if (dir === "DI") {
                        setNewIssuingAgency("UBND Phường Tân Bình");
                        setNewRecipientAgency("Phòng Tư pháp Quận Tân Bình");
                      } else {
                        setNewIssuingAgency("UBND Quận Tân Bình");
                        setNewRecipientAgency("UBND Phường Tân Bình");
                      }
                    }}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                  >
                    <option value="DEN">Văn bản Đến (Cấp số đến tự động)</option>
                    <option value="DI">Dự thảo Văn bản Đi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Số và Ký hiệu văn bản *:</label>
                  <input
                    type="text"
                    required
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    placeholder="VD: 892/UBND-VP"
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px] uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Loại văn bản:</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                  >
                    <option value="CONG_VAN">Công văn</option>
                    <option value="QUYET_DINH">Quyết định</option>
                    <option value="TO_TRINH">Tờ trình</option>
                    <option value="THONG_BAO">Thông báo</option>
                    <option value="BAO_CAO">Báo cáo</option>
                    <option value="KE_HOACH">Kế hoạch</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Độ khẩn:</label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value)}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                  >
                    <option value="THUONG">Thường</option>
                    <option value="KHAN">Khẩn</option>
                    <option value="THUONG_KHAN">Thượng khẩn</option>
                    <option value="HOA_TOC">Hỏa tốc</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Độ mật (Bảo mật ABAC):</label>
                  <select
                    value={newSecurity}
                    onChange={(e) => setNewSecurity(e.target.value as "THUONG" | "MAT" | "TOI_MAT")}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                  >
                    <option value="THUONG">Thường (Nội bộ)</option>
                    <option value="MAT">Mật (Hạn chế truy cập)</option>
                    <option value="TOI_MAT">Tối mật (Chỉ LĐ &amp; Thụ lý)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Trích yếu văn bản *:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập trích yếu chính xác theo thể thức văn bản hành chính..."
                  className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Tóm tắt nội dung chính *:</label>
                <textarea
                  rows={3}
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Tóm tắt nội dung chỉ đạo, yêu cầu báo cáo hoặc nội dung giải quyết..."
                  className="w-full border border-[#9ca3af] p-2 rounded-[2px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Cơ quan ban hành *:</label>
                  <input
                    type="text"
                    required
                    value={newIssuingAgency}
                    onChange={(e) => setNewIssuingAgency(e.target.value)}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Cơ quan / Đơn vị nhận *:</label>
                  <input
                    type="text"
                    required
                    value={newRecipientAgency}
                    onChange={(e) => setNewRecipientAgency(e.target.value)}
                    className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold mb-1">Ngày văn bản *:</label>
                  <input
                    type="date"
                    required
                    value={newIssuedDate}
                    onChange={(e) => setNewIssuedDate(e.target.value)}
                    className="w-full border border-[#9ca3af] px-2 py-2 rounded-[2px]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Hạn xử lý:</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full border border-[#9ca3af] px-2 py-2 rounded-[2px]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Phòng chủ trì:</label>
                  <select
                    value={newDeptId}
                    onChange={(e) => {
                      setNewDeptId(e.target.value);
                      setNewAssigneeId("");
                    }}
                    className="w-full border border-[#9ca3af] px-2 py-2 rounded-[2px]"
                  >
                    <option value="">-- Chờ bút phê --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Chuyên viên:</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full border border-[#9ca3af] px-2 py-2 rounded-[2px]"
                  >
                    <option value="">-- Tự động / Sau --</option>
                    {createModalSpecialists.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#9ca3af] rounded-[2px] cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-4 py-2 bg-[#991b1b] text-white font-bold rounded-[2px] cursor-pointer"
                >
                  {submittingCreate ? "Đang ghi sổ..." : "Lưu vào Sổ Đăng ký Văn bản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bút phê / Báo cáo xử lý / Ký ban hành / Trả lại dự thảo */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#111827] w-full max-w-xl rounded-[2px] shadow-xl my-8"
          >
            <div className="bg-[#1e3a5f] text-white px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#fde68a] font-semibold">
                  [{activeDoc.direction === "DEN" ? "VĂN BẢN ĐẾN" : "VĂN BẢN ĐI"}] Số ký hiệu: {activeDoc.documentSymbol}
                </p>
                <h2 className="text-sm font-bold uppercase">
                  Phiếu Điều hành &amp; Xử lý Văn bản
                </h2>
              </div>
              <button
                type="button"
                aria-label="Đóng phiếu điều hành"
                onClick={() => setActiveDoc(null)}
                className="p-1 hover:bg-white/20 rounded-[2px] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateDocument} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 bg-[#fef2f2] border border-[#dc2626] text-[#991b1b] font-semibold flex items-center gap-2 rounded-[2px]"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3 bg-[#f4f1ea] border border-[#d6d3cd]">
                <p className="font-bold text-[#111827]">{activeDoc.title}</p>
                <p className="text-[#4b5563] mt-1">{activeDoc.contentSummary}</p>
              </div>

              <div>
                <label className="block font-bold mb-1">Thao tác điều hành phù hợp luồng văn bản:</label>
                <select
                  value={docAction}
                  onChange={(e) => setDocAction(e.target.value as DocActionType)}
                  className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px] font-semibold"
                >
                  {getAvailableActions(activeDoc).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {(docAction === "BUT_PHE_PHAN_CONG" ||
                  docAction === "KY_BAN_HANH" ||
                  docAction === "TRA_LAI_DU_THAO") &&
                  currentUserRole !== "LANH_DAO" &&
                  currentUserRole !== "QUAN_TRI" && (
                    <p className="mt-1 text-[#b91c1c] font-semibold">
                      Lưu ý: Tài khoản hiện tại không có thẩm quyền Lãnh đạo / Quản trị cho thao tác này.
                    </p>
                  )}
              </div>

              {docAction === "BUT_PHE_PHAN_CONG" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold mb-1">
                      Nội dung bút phê chỉ đạo của Lãnh đạo *:
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={directiveNote}
                      onChange={(e) => setDirectiveNote(e.target.value)}
                      placeholder="VD: Giao Bộ phận Địa chính - Xây dựng chủ trì kiểm tra thực địa, tham mưu văn bản trả lời trước ngày 20/11/2026..."
                      className="w-full border border-[#9ca3af] p-2 rounded-[2px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Giao đơn vị chủ trì:</label>
                      <select
                        value={leadDepartmentId}
                        onChange={(e) => setLeadDepartmentId(e.target.value)}
                        className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Chuyên viên thụ lý chính:</label>
                      <select
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                      >
                        <option value="">-- Trưởng bộ phận tự phân công --</option>
                        {filteredSpecialists.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {docAction === "TRA_LAI_DU_THAO" && (
                <div>
                  <label className="block font-bold mb-1">
                    Ý kiến chỉ đạo yêu cầu chỉnh sửa dự thảo *:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={directiveNote}
                    onChange={(e) => setDirectiveNote(e.target.value)}
                    placeholder="Nêu rõ nội dung thể thức, căn cứ pháp lý hoặc số liệu cần chuyên viên hoàn thiện lại..."
                    className="w-full border border-[#9ca3af] p-2 rounded-[2px]"
                  />
                </div>
              )}

              {docAction === "CAP_NHAT_XU_LY" && (
                <div>
                  <label className="block font-bold mb-1">
                    {activeDoc.direction === "DI"
                      ? "Nội dung giải trình chỉnh sửa dự thảo để trình ký lại *:"
                      : "Báo cáo kết quả giải quyết & hoàn thành nhiệm vụ *:"}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Nêu rõ kết quả tham mưu, số hiệu văn bản phúc đáp hoặc nội dung đã chỉnh sửa..."
                    className="w-full border border-[#9ca3af] p-2 rounded-[2px]"
                  />
                </div>
              )}

              {docAction === "KY_BAN_HANH" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Họ tên Người ký duyệt *:</label>
                    <input
                      type="text"
                      required
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Chức vụ ký ban hành *:</label>
                    <input
                      type="text"
                      required
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                      className="w-full border border-[#9ca3af] px-2.5 py-2 rounded-[2px]"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setActiveDoc(null)}
                  className="px-4 py-2 border border-[#9ca3af] rounded-[2px] cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#991b1b] text-white font-bold rounded-[2px] cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingAction ? "Đang xử lý..." : "Thực thi Điều hành"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
