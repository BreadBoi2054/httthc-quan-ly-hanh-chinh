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
    <header className="no-print bg-[#fce8a6] text-[#3f1d14] relative overflow-hidden border-b border-[#e5c56b]">
      <div className="absolute left-1/2 -translate-x-1/2 -top-10 hidden md:block">
        <BronzeDrumWatermark />
      </div>

      {/* Dải thông tin công vụ trên cùng */}
      <div className="bg-[#f8dc81] border-b border-[#e4be58] text-xs text-[#7f1d1d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold tracking-wide">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM • Độc lập - Tự do - Hạnh phúc
          </div>
          <div className="flex items-center gap-4 tabular-nums font-medium">
            <span>Đường dây nóng Một cửa: (024) 3971 0101</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Giờ tiếp nhận: Thứ Hai - Thứ Sáu (07:30 - 17:00)</span>
          </div>
        </div>
      </div>

      {/* Quốc hiệu & Tên hệ thống trên nền Vàng kem, chữ Đỏ cờ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3.5 group">
            <AdminEmblem size={56} />
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-[#881318] font-bold">
                ỦY BAN NHÂN DÂN PHƯỜNG THANH NHÀN • TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG
              </p>
              <p className="text-lg sm:text-xl font-bold text-[#ce1126] tracking-tight font-official-serif mt-0.5">
                CỔNG DỊCH VỤ CÔNG &amp; MỘT CỬA ĐIỆN TỬ PHƯỜNG THANH NHÀN
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-expanded={mobileNavOpen}
            aria-label="Mở trình đơn cổng dịch vụ công"
            className="md:hidden p-2 bg-[#ce1126] border border-[#991b1b] rounded-[2px] text-white shrink-0 cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#ce1126] text-white hover:bg-[#a60e1f] rounded-[2px] transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Bàn làm việc Cán bộ ({user.fullName})
                </Link>
              ) : (
                <Link
                  href="/ho-so-cua-toi"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#ce1126] text-white hover:bg-[#a60e1f] rounded-[2px] transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Hồ sơ của {user.fullName}
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-white hover:bg-[#fef2f2] border border-[#ce1126] text-[#991b1b] rounded-[2px] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/dang-nhap"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wide bg-white hover:bg-[#fef2f2] text-[#ce1126] border border-[#ce1126] rounded-[2px] transition-colors"
            >
              Đăng nhập Cán bộ / Công dân
            </Link>
          )}
        </div>
      </div>

      {/* Thanh điều hướng Đỏ cờ đặc trưng (như mẫu Cổng Dịch vụ công) */}
      <div className="relative z-10 border-t border-[#dc2626]/40">
        <nav
          className="max-w-7xl mx-auto bg-[#d71920] text-white md:rounded-t-[2px]"
          aria-label="Điều hướng cổng hành chính"
        >
          <div
            className={`px-2 sm:px-4 ${
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
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? "bg-[#9e0e14] text-[#fef08a] border-[#facc15]"
                      : "text-white border-transparent hover:bg-[#b51218]"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 text-[#fde047]" />}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
