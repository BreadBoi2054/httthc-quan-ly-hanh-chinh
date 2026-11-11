import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { evaluateDossierSla } from "@/lib/sla-engine";
import { DossierStatusBadge, FeeBadge, SlaBadge } from "@/components/StatusBadges";
import { ArrowRight, FilePlus2, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StaffOverviewPage() {
  const session = await getCurrentSession();
  const docVisibilityWhere =
    session && session.role !== "LANH_DAO" && session.role !== "QUAN_TRI"
      ? {
          OR: [
            { security: "THUONG" as const },
            { createdById: session.userId },
            { assigneeId: session.userId },
          ],
        }
      : {};

  const [departments, procedures, dossiers, documents] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.procedure.findMany({ where: { isActive: true } }),
    prisma.dossier.findMany({
      include: {
        procedure: { select: { code: true, name: true, field: true } },
        department: { select: { id: true, code: true, name: true } },
        assignee: { select: { fullName: true } },
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.officialDocument.findMany({
      where: docVisibilityWhere,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();
  const enrichedDossiers = dossiers.map((d) => ({
    ...d,
    sla: evaluateDossierSla({
      status: d.status,
      dueAt: d.dueAt,
      completedAt: d.completedAt,
      slaPausedAt: d.slaPausedAt,
      supplementDeadline: d.supplementDeadline,
      now,
    }),
  }));

  const activeDossiers = enrichedDossiers.filter(
    (d) => d.status !== "HOAN_THANH" && d.status !== "TU_CHOI_TIEP_NHAN" && d.status !== "DA_RUT_HO_SO"
  );
  const completedDossiers = enrichedDossiers.filter((d) => d.status === "HOAN_THANH");
  const closedDossiers = enrichedDossiers.filter(
    (d) => d.status === "TU_CHOI_TIEP_NHAN" || d.status === "DA_RUT_HO_SO"
  );
  const overdueDossiers = activeDossiers.filter((d) => d.sla.isOverdue);
  const warningDossiers = activeDossiers.filter((d) => d.sla.state === "SAP_DEN_HAN");
  const pendingApprovalDossiers = activeDossiers.filter((d) => d.status === "CHO_PHE_DUYET");
  const newSubmittedDossiers = activeDossiers.filter((d) => d.status === "MOI_NOP");
  const pendingDirectiveDocs = documents.filter((doc) => doc.status === "CHO_BUT_PHE");

  const collectedFees = dossiers
    .filter((d) => d.feeStatus === "DA_THU_PHI")
    .reduce((acc, cur) => acc + cur.feeAmount, 0);
  const unpaidFees = activeDossiers
    .filter((d) => d.feeStatus === "CHUA_THU_PHI" && !d.feeExempt)
    .reduce((acc, cur) => acc + cur.feeAmount, 0);

  const deptRows = departments
    .filter((dept) => dept.code !== "BP-MC")
    .map((dept) => {
      const items = enrichedDossiers.filter((d) => d.departmentId === dept.id);
      const completed = items.filter((d) => d.status === "HOAN_THANH").length;
      const overdue = items.filter((d) => d.status !== "HOAN_THANH" && d.sla.isOverdue).length;
      const inProgress = items.filter(
        (d) =>
          d.status !== "HOAN_THANH" &&
          d.status !== "TU_CHOI_TIEP_NHAN" &&
          d.status !== "DA_RUT_HO_SO"
      ).length;
      return {
        ...dept,
        total: items.length,
        completed,
        inProgress,
        overdue,
      };
    });

  const maxDeptTotal = Math.max(1, ...deptRows.map((r) => r.total));

  // Hồ sơ ưu tiên cần xử lý ngay theo vai trò
  const priorityQueue = enrichedDossiers
    .filter((d) => {
      if (session?.role === "MOT_CUA") {
        return d.status === "MOI_NOP" || d.status === "CHO_TRA_KET_QUA" || d.status === "YEU_CAU_BO_SUNG";
      }
      if (session?.role === "LANH_DAO") {
        return d.status === "CHO_PHE_DUYET" || (d.status !== "HOAN_THANH" && d.sla.isOverdue);
      }
      if (session?.role === "CHUYEN_VIEN") {
        return (
          d.departmentId === session.departmentId &&
          (d.status === "DA_TIEP_NHAN" || d.status === "DANG_THAM_DINH" || d.status === "YEU_CAU_BO_SUNG")
        );
      }
      return (
        d.status !== "HOAN_THANH" &&
        d.status !== "TU_CHOI_TIEP_NHAN" &&
        d.status !== "DA_RUT_HO_SO"
      );
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Hàng tiêu đề điều hành & Một phát hiện trọng tâm (One Finding) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#d6d3cd] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] font-official-serif">
            Trung tâm Chỉ huy &amp; Giám sát Tiến độ Hành chính
          </h1>
          <p className="text-sm text-[#4b5563] mt-0.5">
            {overdueDossiers.length > 0 ? (
              <span className="text-[#b91c1c] font-semibold">
                Cảnh báo kỷ cương: Có {overdueDossiers.length} hồ sơ quá hạn SLA cần lập Phiếu xin lỗi (Mẫu 04)
              </span>
            ) : (
              <span className="text-[#15803d] font-semibold">
                100% hồ sơ đang thụ lý nằm trong thời hạn quy định
              </span>
            )}{" "}
            • {newSubmittedDossiers.length} hồ sơ mới chờ Một cửa tiếp nhận • {pendingApprovalDossiers.length} hồ sơ trình ký •{" "}
            {pendingDirectiveDocs.length} văn bản đến chờ bút phê.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/he-thong/ho-so?intake=1"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-[2px]"
          >
            <FilePlus2 className="w-4 h-4" />
            Tiếp nhận hồ sơ tại quầy
          </Link>
          <Link
            href="/he-thong/van-ban"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-[#ce1126] text-[#991b1b] hover:bg-[#fef2f2] rounded-[2px]"
          >
            Sổ Văn bản đến / đi
          </Link>
        </div>
      </div>

      {/* Dải 4 chỉ số điều hành phân cách bằng đường kẻ mảnh 1px (KPI Strip chuẩn App Screen) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#d6d3cd] divide-y sm:divide-y-0 sm:divide-x divide-[#d6d3cd] bg-[#fffdf5] rounded-[2px] tabular-nums">
        <div className="p-4">
          <p className="text-xs text-[#4b5563]">Tổng hồ sơ đang giải quyết</p>
          <p className="text-3xl font-bold text-[#111827] mt-1">{activeDossiers.length}</p>
          <p className="text-xs text-[#4b5563] mt-1">
            Tổng {dossiers.length} HS ({completedDossiers.length} hoàn thành • {closedDossiers.length} đóng/rút)
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs text-[#4b5563]">Cảnh báo hạn giải quyết (SLA)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#b91c1c]">{overdueDossiers.length} quá hạn</span>
            <span className="text-sm font-semibold text-[#b45309]">• {warningDossiers.length} sắp hạn</span>
          </div>
          <p className="text-xs text-[#4b5563] mt-1">Tính trừ Thứ Bảy, Chủ Nhật &amp; Lịch lễ 2026</p>
        </div>

        <div className="p-4">
          <p className="text-xs text-[#4b5563]">Thu nộp Lệ phí Hành chính</p>
          <p className="text-2xl font-bold text-[#15803d] mt-1">
            {collectedFees.toLocaleString("vi-VN")} <span className="text-xs font-normal text-[#4b5563]">đồng</span>
          </p>
          <p className="text-xs text-[#b91c1c] mt-1">
            Chờ thu trước khi trả KQ: {unpaidFees.toLocaleString("vi-VN")} đ
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs text-[#4b5563]">Văn bản Điều hành &amp; Danh mục</p>
          <p className="text-2xl font-bold text-[#991b1b] mt-1">
            {documents.length} <span className="text-xs font-normal text-[#4b5563]">văn bản</span>
          </p>
          <p className="text-xs text-[#4b5563] mt-1">
            {pendingDirectiveDocs.length} VB chờ bút phê • {procedures.length} TTHC công bố
          </p>
        </div>
      </div>

      {/* Hàng nội dung chính: Hàng đợi cần xử lý ngay (8 cột) + Biểu đồ tải SLA theo phòng ban (4 cột) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Khối 1: Hồ sơ ưu tiên tác nghiệp ngay */}
        <div className="xl:col-span-8 border border-[#d6d3cd] rounded-[2px]">
          <div className="px-4 py-3 bg-[#fffdf5] border-b border-[#d6d3cd] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase text-[#111827]">
                Hàng đợi Hồ sơ Cần Xử lý theo Phân quyền ({priorityQueue.length})
              </h2>
              <p className="text-xs text-[#4b5563]">
                Ưu tiên hiển thị hồ sơ quá hạn, sắp đến hạn hoặc đang chờ thao tác của vai trò hiện tại
              </p>
            </div>
            <Link
              href="/he-thong/ho-so"
              className="text-xs font-semibold text-[#991b1b] hover:underline inline-flex items-center gap-1"
            >
              Mở toàn bộ danh sách <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#d6d3cd] text-left text-[#4b5563] bg-white">
                  <th className="px-3.5 py-2.5 font-semibold">Mã hồ sơ</th>
                  <th className="px-3.5 py-2.5 font-semibold">Người yêu cầu &amp; Thủ tục</th>
                  <th className="px-3.5 py-2.5 font-semibold">Trạng thái</th>
                  <th className="px-3.5 py-2.5 font-semibold">Tiến độ SLA</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {priorityQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#6b7280]">
                      Hiện không có hồ sơ tồn đọng trong hàng đợi của vai trò này.
                    </td>
                  </tr>
                ) : (
                  priorityQueue.map((d) => (
                    <tr key={d.id} className="hover:bg-[#fffdf5]">
                      <td className="px-3.5 py-3 align-top tabular-nums">
                        <Link
                          href={`/he-thong/ho-so/${d.id}`}
                          className="font-bold text-[#991b1b] hover:underline block"
                        >
                          {d.dossierCode}
                        </Link>
                        <span className="text-[11px] text-[#6b7280]">{d.department.code}</span>
                      </td>
                      <td className="px-3.5 py-3 align-top">
                        <p className="font-semibold text-[#111827]">{d.applicantName}</p>
                        <p className="text-[#4b5563] line-clamp-1">{d.procedure.name}</p>
                        <div className="mt-1">
                          <FeeBadge status={d.feeStatus} amount={d.feeAmount} />
                        </div>
                      </td>
                      <td className="px-3.5 py-3 align-top">
                        <DossierStatusBadge status={d.status} />
                      </td>
                      <td className="px-3.5 py-3 align-top">
                        <SlaBadge state={d.sla.state} label={d.sla.label} />
                        {d.dueAt && (
                          <p className="text-[11px] text-[#6b7280] tabular-nums mt-1">
                            Hạn: {new Date(d.dueAt).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                      </td>
                      <td className="px-3.5 py-3 align-top text-right">
                        <Link
                          href={`/he-thong/ho-so/${d.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold bg-[#ce1126] hover:bg-[#991b1b] text-white rounded-[2px]"
                        >
                          Xử lý
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Khối 2: Biểu đồ thanh ngang phân bổ hồ sơ theo Bộ phận chuyên môn + Văn bản khẩn */}
        <div className="xl:col-span-4 space-y-6">
          <div className="border border-[#d6d3cd] rounded-[2px] p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-2">
              <h2 className="text-sm font-bold uppercase text-[#111827]">
                Tải Hồ sơ theo Bộ phận Chuyên môn
              </h2>
              <span className="text-[11px] text-[#6b7280] tabular-nums">Tổng {dossiers.length} HS</span>
            </div>

            <div className="space-y-3 text-xs tabular-nums">
              {deptRows.map((row) => {
                const completedPct = Math.round((row.completed / maxDeptTotal) * 100);
                const activePct = Math.round(((row.inProgress - row.overdue) / maxDeptTotal) * 100);
                const overduePct = Math.round((row.overdue / maxDeptTotal) * 100);
                return (
                  <div key={row.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#111827] truncate pr-2">{row.name}</span>
                      <span className="text-[#4b5563] shrink-0">
                        <strong>{row.total}</strong> HS ({row.overdue > 0 ? `${row.overdue} trễ` : "0 trễ"})
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#f3f4f6] flex overflow-hidden rounded-[1px]">
                      {completedPct > 0 && (
                        <div
                          style={{ width: `${completedPct}%` }}
                          className="bg-[#15803d]"
                          title={`Hoàn thành: ${row.completed}`}
                        />
                      )}
                      {activePct > 0 && (
                        <div
                          style={{ width: `${activePct}%` }}
                          className="bg-[#ce1126]"
                          title={`Đang thụ lý đúng hạn: ${row.inProgress - row.overdue}`}
                        />
                      )}
                      {overduePct > 0 && (
                        <div
                          style={{ width: `${overduePct}%` }}
                          className="bg-[#b91c1c]"
                          title={`Quá hạn: ${row.overdue}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#f3f4f6] flex flex-wrap gap-3 text-[11px] text-[#4b5563]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#15803d] inline-block" /> Đã hoàn thành
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#ce1126] inline-block" /> Đang xử lý
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#b91c1c] inline-block" /> Quá hạn SLA
              </span>
            </div>
          </div>

          {/* Văn bản điều hành khẩn / mới */}
          <div className="border border-[#d6d3cd] rounded-[2px] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-2">
              <h2 className="text-sm font-bold uppercase text-[#111827]">Văn bản Điều hành Mới</h2>
              <Link href="/he-thong/van-ban" className="text-xs font-semibold text-[#991b1b] hover:underline">
                Xem sổ VB
              </Link>
            </div>

            <div className="divide-y divide-[#f3f4f6] text-xs">
              {documents.slice(0, 3).map((doc) => (
                <div key={doc.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#991b1b] tabular-nums">
                      [{doc.direction === "DEN" ? "VB ĐẾN" : "VB ĐI"}] {doc.documentSymbol}
                    </span>
                    {doc.urgency !== "THUONG" && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 bg-[#fef2f2] text-[#b91c1c] border border-[#fca5a5] rounded-[2px]">
                        <AlertTriangle className="w-3 h-3" />
                        {doc.urgency}
                      </span>
                    )}
                  </div>
                  <p className="text-[#111827] line-clamp-2">{doc.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
