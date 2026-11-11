"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RoleBadge } from "@/components/StatusBadges";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

interface DepartmentInfo {
  id: string;
  code: string;
  name: string;
  roomNumber: string;
  phoneExt: string;
  headTitle: string;
}

interface StaffUserInfo {
  id: string;
  username: string;
  fullName: string;
  role: string;
  positionTitle: string | null;
  phone: string | null;
  department: { code: string; name: string } | null;
}

interface HolidayInfo {
  id: string;
  dateStr: string;
  name: string;
}

interface AuditLogInfo {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityCode: string;
  detail: string;
  createdAt: string;
}

export default function AdminGovernancePage() {
  const [currentRole, setCurrentRole] = useState<string>("");
  const [canViewAuditLogs, setCanViewAuditLogs] = useState<boolean>(false);
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUserInfo[]>([]);
  const [holidays, setHolidays] = useState<HolidayInfo[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");
  const [confirmDeleteHolidayId, setConfirmDeleteHolidayId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadMetadata = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/metadata")
      .then((r) => r.json())
      .then((data) => {
        if (data?.currentRole) setCurrentRole(data.currentRole);
        setCanViewAuditLogs(Boolean(data?.canViewAuditLogs));
        if (data?.departments) setDepartments(data.departments);
        if (data?.staffUsers) setStaffUsers(data.staffUsers);
        if (data?.holidays) setHolidays(data.holidays);
        if (data?.auditLogs) setAuditLogs(data.auditLogs);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setFeedback("");
    const res = await fetch("/api/admin/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateStr: newHolidayDate, name: newHolidayName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Không thể thêm ngày nghỉ lễ.");
      return;
    }
    setFeedback(`Đã thêm ngày nghỉ lễ SLA: ${data.holiday.name} (${data.holiday.dateStr}).`);
    setNewHolidayDate("");
    setNewHolidayName("");
    loadMetadata();
  }

  async function handleDeleteHoliday(id: string) {
    setErrorMsg("");
    setFeedback("");
    const res = await fetch(`/api/admin/metadata?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Không thể xóa ngày nghỉ lễ.");
      return;
    }
    setFeedback("Đã xóa ngày nghỉ lễ khỏi danh mục tính hạn SLA.");
    setConfirmDeleteHolidayId(null);
    loadMetadata();
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-[#4b5563]">
        Đang tải Cơ cấu tổ chức, Lịch nghỉ lễ tính SLA và Nhật ký Kiểm toán...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#d6d3cd]">
        <p className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
          Quản trị Hệ thống, Phân quyền RBAC/ABAC &amp; Kiểm toán Nội bộ
        </p>
        <h1 className="text-xl font-bold text-[#111827] font-official-serif mt-0.5">
          Cơ cấu Phòng ban, Cán bộ Công chức, Lịch Nghỉ lễ SLA &amp; Nhật ký Bất biến
        </h1>
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
      {errorMsg && (
        <div
          role="alert"
          className="p-3 bg-[#fef2f2] border border-[#dc2626] text-[#991b1b] text-xs font-semibold flex items-center gap-2 rounded-[2px]"
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hàng 1: Phòng ban & Lịch nghỉ lễ SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 border border-[#d6d3cd] rounded-[2px] overflow-hidden">
          <div className="bg-[#fff8dc] px-4 py-2.5 border-b border-[#d6d3cd] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#991b1b]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
              1. Cơ cấu Phòng ban / Bộ phận Chuyên môn ({departments.length} đơn vị)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#fafaf9] border-b border-[#d6d3cd] text-[#374151]">
                  <th className="py-2 px-3 text-left">Mã</th>
                  <th className="py-2 px-3 text-left">Tên Bộ phận Chuyên môn</th>
                  <th className="py-2 px-3 text-left">Phòng / Quầy</th>
                  <th className="py-2 px-3 text-left">Phụ trách</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-[#fafaf9]">
                    <td className="py-2.5 px-3 font-bold text-[#991b1b]">{d.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#111827]">{d.name}</td>
                    <td className="py-2.5 px-3 text-[#4b5563] tabular-nums">
                      {d.roomNumber} (Ext: {d.phoneExt})
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#991b1b]">{d.headTitle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-5 border border-[#d6d3cd] rounded-[2px] overflow-hidden flex flex-col">
          <div className="bg-[#fff8dc] px-4 py-2.5 border-b border-[#d6d3cd] flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#991b1b]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
              2. Lịch Nghỉ Lễ Loại trừ Khỏi SLA ({holidays.length} ngày)
            </h2>
          </div>

          {currentRole === "QUAN_TRI" && (
            <form
              onSubmit={handleAddHoliday}
              className="p-3 bg-[#fffdf5] border-b border-[#d6d3cd] grid grid-cols-12 gap-2 text-xs"
            >
              <input
                type="date"
                required
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                aria-label="Ngày nghỉ lễ mới"
                className="col-span-5 border border-[#9ca3af] bg-white px-2 py-1.5 rounded-[2px] tabular-nums"
              />
              <input
                type="text"
                required
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="Tên kỳ nghỉ lễ / nghỉ bù..."
                className="col-span-5 border border-[#9ca3af] bg-white px-2 py-1.5 rounded-[2px]"
              />
              <button
                type="submit"
                className="col-span-2 inline-flex items-center justify-center bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-bold rounded-[2px] cursor-pointer"
                title="Thêm ngày nghỉ lễ SLA"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="max-h-64 overflow-y-auto divide-y divide-[#e5e7eb] text-xs">
            {holidays.map((h) => (
              <div key={h.id} className="px-4 py-2 flex items-center justify-between gap-2">
                <span className="font-medium text-[#111827]">{h.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-[#991b1b] tabular-nums">{h.dateStr}</span>
                  {currentRole === "QUAN_TRI" &&
                    (confirmDeleteHolidayId === h.id ? (
                      <div className="inline-flex items-center gap-1 bg-[#fef2f2] border border-[#dc2626] px-1.5 py-0.5 rounded-[2px]">
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="px-1.5 py-0.5 bg-[#991b1b] text-white font-bold text-[11px] rounded-[2px] cursor-pointer"
                        >
                          Xác nhận xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteHolidayId(null)}
                          className="px-1.5 py-0.5 bg-white border border-[#9ca3af] text-[#111827] text-[11px] rounded-[2px] cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteHolidayId(h.id)}
                        aria-label={`Xóa ngày nghỉ lễ ${h.dateStr}`}
                        className="text-[#4b5563] hover:text-[#b91c1c] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Hàng 2: Danh sách cán bộ & Phân quyền RBAC/ABAC */}
      <section className="border border-[#d6d3cd] rounded-[2px] overflow-hidden">
        <div className="bg-[#fff8dc] px-4 py-2.5 border-b border-[#d6d3cd] flex items-center gap-2">
          <Users className="w-4 h-4 text-[#991b1b]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
            3. Danh sách Công chức, Viên chức &amp; Phân quyền Thẩm quyền ({staffUsers.length} tài khoản nội bộ)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#fafaf9] border-b border-[#d6d3cd] text-[#374151]">
                <th className="py-2 px-3 text-left">Tài khoản</th>
                <th className="py-2 px-3 text-left">Họ và tên cán bộ</th>
                <th className="py-2 px-3 text-left">Chức danh công vụ</th>
                <th className="py-2 px-3 text-left">Vai trò RBAC</th>
                <th className="py-2 px-3 text-left">Đơn vị giới hạn thẩm quyền (ABAC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {staffUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#991b1b]">
                    {u.username}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[#111827]">{u.fullName}</td>
                  <td className="py-2.5 px-3 text-[#4b5563]">{u.positionTitle || "---"}</td>
                  <td className="py-2.5 px-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#111827]">
                    {u.department ? `[${u.department.code}] ${u.department.name}` : "Toàn cơ quan"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hàng 3: Nhật ký Kiểm toán Bất biến (Audit Log - Giới hạn QUAN_TRI & LANH_DAO) */}
      <section className="border border-[#d6d3cd] rounded-[2px] overflow-hidden">
        <div className="bg-[#fff8dc] px-4 py-2.5 border-b border-[#d6d3cd] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#991b1b]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
            4. Nhật ký Kiểm toán Hệ thống Bất biến (Immutable Audit Trail)
          </h2>
        </div>
        {!canViewAuditLogs ? (
          <div className="p-5 text-xs text-[#4b5563] bg-[#fafaf9]">
            Theo quy chế bảo mật an toàn thông tin nội bộ, dữ liệu Nhật ký Kiểm toán chi tiết chỉ mở quyền truy xuất đối với <strong>Lãnh đạo UBND (`LANH_DAO`)</strong> và <strong>Quản trị viên Hệ thống (`QUAN_TRI`)</strong>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#fafaf9] border-b border-[#d6d3cd] text-[#374151]">
                  <th className="py-2 px-3 text-left">Thời điểm ghi nhận</th>
                  <th className="py-2 px-3 text-left">Người thực hiện</th>
                  <th className="py-2 px-3 text-left">Mã thao tác</th>
                  <th className="py-2 px-3 text-left">Đối tượng</th>
                  <th className="py-2 px-3 text-left">Chi tiết nghiệp vụ đã thực thi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fafaf9]">
                    <td className="py-2.5 px-3 whitespace-nowrap tabular-nums text-[#4b5563]">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-[#111827] block">{log.actorName}</span>
                      <RoleBadge role={log.actorRole} />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#991b1b] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-[#991b1b]">
                      [{log.entityType}] {log.entityCode}
                    </td>
                    <td className="py-2.5 px-3 text-[#374151]">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
