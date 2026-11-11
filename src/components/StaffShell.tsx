"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminEmblem, BronzeDrumWatermark, DongSonFretStrip } from "./AdminEmblem";
import { ROLE_LABELS } from "@/lib/workflow-engine";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  BookMarked,
  ShieldAlert,
  Globe,
  LogOut,
  Menu,
  X,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface StaffUser {
  userId: string;
  username: string;
  fullName: string;
  role: Role;
  positionTitle: string | null;
  departmentName: string | null;
}

export function StaffShell({
  user,
  children,
}: {
  user: StaffUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState({
    overdue: 0,
    pendingApproval: 0,
    newIntake: 0,
    pendingDocs: 0,
  });

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((data) => {
        if (data?.summary && data?.statusCounts) {
          setCounts({
            overdue: data.summary.overdueActive || 0,
            pendingApproval: data.statusCounts.CHO_PHE_DUYET || 0,
            newIntake: data.statusCounts.MOI_NOP || 0,
            pendingDocs: data.summary.pendingDirectiveDocs || 0,
          });
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Khóa cuộn nền & hỗ trợ phím Escape đóng ngăn kéo điều hướng di động
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dang-nhap");
    router.refresh();
  }

  const dossierBadgeCount =
    user.role === "LANH_DAO"
      ? counts.pendingApproval
      : user.role === "MOT_CUA"
      ? counts.newIntake
      : counts.overdue;

  const dossierBadgeLabel =
    user.role === "LANH_DAO"
      ? `Chờ ký ${counts.pendingApproval}`
      : user.role === "MOT_CUA"
      ? `Mới ${counts.newIntake}`
      : counts.overdue > 0
      ? `Quá hạn ${counts.overdue}`
      : "";

  const navItems = [
    {
      href: "/he-thong",
      label: "Tổng quan điều hành",
      icon: LayoutDashboard,
      badge: counts.overdue > 0 ? `Quá hạn ${counts.overdue}` : "",
      exact: true,
    },
    {
      href: "/he-thong/ho-so",
      label: "Hồ sơ Một cửa",
      icon: FolderKanban,
      badge: dossierBadgeCount > 0 ? dossierBadgeLabel : "",
      exact: false,
    },
    {
      href: "/he-thong/van-ban",
      label: "Văn bản & Điều hành",
      icon: FileText,
      badge: counts.pendingDocs > 0 ? `Chờ bút phê ${counts.pendingDocs}` : "",
      exact: false,
    },
    {
      href: "/he-thong/thu-tuc",
      label: "Danh mục TTHC",
      icon: BookMarked,
      badge: "",
      exact: false,
    },
    {
      href: "/he-thong/quan-tri",
      label: "Cơ cấu & Nhật ký Audit",
      icon: ShieldAlert,
      badge: "",
      exact: false,
    },
  ];

  function renderSidebar(isCompact: boolean) {
    return (
      <div
        className={`relative overflow-hidden flex flex-col h-full bg-[#fffdf5] border-r border-[#e5c56b] shrink-0 transition-[width] duration-150 ${
          isCompact ? "w-16" : "w-64"
        }`}
      >
        {!isCompact && (
          <div className="absolute -bottom-16 -left-12 pointer-events-none">
            <BronzeDrumWatermark size={220} className="opacity-[0.11]" />
          </div>
        )}

        {/* Đầu mục cơ quan */}
        <div className="p-3.5 border-b-2 border-[#ce1126] bg-[#fce8a6] text-[#3f1d14] flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <AdminEmblem size={isCompact ? 30 : 36} />
            {!isCompact && (
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-[#881318] font-bold truncate">
                  UBND PHƯỜNG THANH NHÀN
                </p>
                <p className="text-sm font-bold text-[#ce1126] truncate font-official-serif">Bàn làm việc Điện tử</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            title={isCompact ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            aria-label={isCompact ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            className="hidden lg:inline-flex p-1 hover:bg-[#f5d576] rounded-[2px] text-[#991b1b] cursor-pointer shrink-0"
          >
            {isCompact ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {!isCompact && <DongSonFretStrip className="relative z-10 border-t-0" />}

        {/* Định danh cán bộ đang đăng nhập */}
        {!isCompact && (
          <div className="px-4 py-3 border-b border-[#ebe0be] bg-[#fff7da] text-xs space-y-0.5">
            <p className="font-bold text-[#111827] truncate">{user.fullName}</p>
            <p className="text-[#ce1126] font-semibold">{ROLE_LABELS[user.role]}</p>
            {user.departmentName && (
              <p className="text-[#4b5563] text-[11px] truncate">{user.departmentName}</p>
            )}
          </div>
        )}

        {/* Điều hướng phân hệ */}
        <nav className="flex-1 px-2 py-3 space-y-1" aria-label="Phân hệ nghiệp vụ nội bộ">
          {!isCompact && (
            <p className="px-2.5 pb-1 text-[11px] text-[#4b5563] font-semibold">Phân hệ tác nghiệp</p>
          )}
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCompact ? item.label : undefined}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center ${
                  isCompact ? "justify-center px-2 py-2.5" : "justify-between gap-2 px-2.5 py-2"
                } text-sm rounded-[3px] transition-colors ${
                  isActive
                    ? "bg-[#fef2f2] text-[#991b1b] font-bold border-l-4 border-[#ce1126]"
                    : "text-[#374151] hover:bg-[#fff3c4]"
                }`}
              >
                <span className="inline-flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0 text-[#ce1126]" />
                  {!isCompact && <span className="truncate">{item.label}</span>}
                </span>
                {!isCompact && item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5] rounded-[2px] tabular-nums shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[#ebe0be] space-y-1">
            {!isCompact && (
              <p className="px-2.5 pb-1 text-[11px] text-[#4b5563] font-semibold">Tiện ích tra cứu</p>
            )}
            <Link
              href="/so-tay-nghiep-vu"
              title={isCompact ? "Sổ tay nghiệp vụ" : undefined}
              className={`flex items-center ${
                isCompact ? "justify-center px-2 py-2.5" : "gap-2.5 px-2.5 py-2"
              } text-sm text-[#374151] hover:bg-[#fff3c4] rounded-[3px]`}
            >
              <BookOpen className="w-4 h-4 text-[#ce1126] shrink-0" />
              {!isCompact && "Sổ tay nghiệp vụ"}
            </Link>
            <Link
              href="/"
              title={isCompact ? "Cổng Công khai Công dân" : undefined}
              className={`flex items-center ${
                isCompact ? "justify-center px-2 py-2.5" : "gap-2.5 px-2.5 py-2"
              } text-sm text-[#374151] hover:bg-[#fff3c4] rounded-[3px]`}
            >
              <Globe className="w-4 h-4 text-[#b45309] shrink-0" />
              {!isCompact && "Cổng Công khai Công dân"}
            </Link>
          </div>
        </nav>

        <div className="p-2.5 border-t border-[#ebe0be]">
          <button
            type="button"
            onClick={handleLogout}
            title={isCompact ? "Kết thúc ca / Đổi vai trò" : undefined}
            className="w-full inline-flex items-center justify-center gap-2 px-2.5 py-2 text-xs font-semibold border border-[#ce1126]/50 bg-white hover:bg-[#fef2f2] text-[#991b1b] hover:border-[#ce1126] rounded-[2px] cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!isCompact && "Kết thúc ca / Đổi vai trò"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f4f4f5]">
      {/* Thanh tiêu đề di động */}
      <div className="no-print lg:hidden bg-[#fce8a6] text-[#991b1b] px-4 py-3 flex items-center justify-between border-b-2 border-[#ce1126]">
        <div className="flex items-center gap-2">
          <AdminEmblem size={30} />
          <span className="font-bold text-sm font-official-serif">UBND P. Thanh Nhàn ({user.fullName})</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label="Mở trình đơn điều hướng"
          className="p-1.5 bg-[#ce1126] text-white rounded-[2px] cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Ngăn kéo di động */}
      {mobileOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-40 bg-black/50 flex" role="dialog" aria-modal="true">
          {renderSidebar(false)}
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Cột điều hướng máy tính */}
      <aside className="no-print hidden lg:block">{renderSidebar(collapsed)}</aside>

      {/* Khung giấy trắng điều hành trung tâm */}
      <div className="flex-1 min-w-0 lg:p-3">
        <main className="bg-white border border-[#e5e7eb] min-h-[calc(100vh-24px)] p-4 sm:p-6 rounded-[2px]">
          {children}
        </main>
      </div>
    </div>
  );
}
