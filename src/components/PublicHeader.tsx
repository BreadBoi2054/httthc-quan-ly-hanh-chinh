"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminEmblem, BronzeDrumWatermark } from "./AdminEmblem";
import {
  LogOut,
  UserCheck,
  LayoutDashboard,
  BookOpen,
  Search,
  FilePlus2,
  ListChecks,
  FolderCheck,
  Menu,
  X,
} from "lucide-react";

interface CurrentUser {
  userId: string;
  username: string;
  fullName: string;
  role: string;
  positionTitle?: string | null;
}

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
        else setUser(null);
      })
      .catch(() => setUser(null));
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const isStaff =
    user &&
    (user.role === "MOT_CUA" ||
      user.role === "CHUYEN_VIEN" ||
      user.role === "LANH_DAO" ||
      user.role === "QUAN_TRI");

  const navItems = [
    { href: "/", label: "Trang chủ", icon: null },
    { href: "/thu-tuc", label: "Danh mục TTHC", icon: ListChecks },
    { href: "/nop-ho-so", label: "Nộp hồ sơ trực tuyến", icon: FilePlus2 },
    { href: "/tra-cuu", label: "Tra cứu hồ sơ", icon: Search },
    ...(user && !isStaff
      ? [{ href: "/ho-so-cua-toi", label: "Hồ sơ của tôi", icon: FolderCheck }]
      : []),
    { href: "/so-tay-nghiep-vu", label: "Sổ tay nghiệp vụ", icon: BookOpen },
  ];

  return (
    <header className="no-print border-b-2 border-[#d97706] bg-[#991b1b] text-white relative overflow-hidden">
      <div className="absolute right-4 -top-12 hidden lg:block">
        <BronzeDrumWatermark />
      </div>

      {/* Dải thông tin công vụ trên cùng */}
      <div className="bg-[#7f1d1d] border-b border-[#b91c1c] text-xs text-[#fef3c7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="font-medium tracking-wide">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM • Độc lập - Tự do - Hạnh phúc
          </div>
          <div className="flex items-center gap-4 tabular-nums">
            <span>Đường dây nóng Một cửa: (028) 3811 0101</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Giờ tiếp nhận: Thứ Hai - Thứ Sáu (07:30 - 17:00)</span>
          </div>
        </div>
      </div>

      {/* Quốc hiệu & Tên hệ thống */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3.5 group">
            <AdminEmblem size={52} />
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[#fde68a] font-semibold">
                ỦY BAN NHÂN DÂN PHƯỜNG TÂN BÌNH • TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG
              </p>
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight font-official-serif mt-0.5">
                HỆ THỐNG THÔNG TIN QUẢN LÝ HÀNH CHÍNH &amp; MỘT CỬA ĐIỆN TỬ
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-expanded={mobileNavOpen}
            aria-label="Mở trình đơn cổng dịch vụ công"
            className="md:hidden p-2 bg-[#7f1d1d] border border-[#fca5a5]/40 rounded-[2px] text-white shrink-0 cursor-pointer"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {user ? (
            <>
              {isStaff ? (
                <Link
                  href="/he-thong"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#f59e0b] text-[#111827] hover:bg-[#fbbf24] rounded-[2px] transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Bàn làm việc Cán bộ ({user.fullName})
                </Link>
              ) : (
                <Link
                  href="/ho-so-cua-toi"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#f59e0b] text-[#111827] hover:bg-[#fbbf24] rounded-[2px] transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Hồ sơ của {user.fullName}
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium bg-[#7f1d1d] hover:bg-[#651515] border border-[#fca5a5]/40 text-white rounded-[2px] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/dang-nhap"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wide bg-[#f59e0b] text-[#111827] hover:bg-[#fbbf24] rounded-[2px] transition-colors"
            >
              Đăng nhập Cán bộ / Công dân
            </Link>
          )}
        </div>
      </div>

      {/* Thanh điều hướng chính */}
      <nav
        className="bg-[#1e3a5f] border-t border-[#d97706]/60 relative z-10"
        aria-label="Điều hướng cổng hành chính"
      >
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 ${
            mobileNavOpen ? "flex flex-col py-1.5 md:flex-row md:py-0" : "hidden md:flex"
          } md:items-center md:overflow-x-auto`}
        >
          {navItems.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "bg-[#152c4a] text-[#fde68a] border-[#f59e0b]"
                    : "text-white/90 border-transparent hover:bg-[#152c4a]/70 hover:text-white"
                }`}
              >
                {Icon && <Icon className="w-4 h-4 text-[#fbbf24]" />}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
