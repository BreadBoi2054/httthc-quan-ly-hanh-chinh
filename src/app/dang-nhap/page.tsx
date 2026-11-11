"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { BronzeDrumWatermark, LacBirdEmblem } from "@/components/AdminEmblem";
import { Shield, KeyRound, UserCog } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    username: "motcua",
    roleLabel: "Cán bộ Một cửa",
    name: "Lê Thị Thu Hà",
    desc: "Tiếp nhận hồ sơ, xuất Mẫu 01/02/03, thu lệ phí & trả kết quả",
  },
  {
    username: "chuyenvien.tuphap",
    roleLabel: "Chuyên viên Tư pháp",
    name: "Phạm Hoàng Nam",
    desc: "Thụ lý, đối chiếu thành phần & trình ký hồ sơ Hộ tịch - Chứng thực",
  },
  {
    username: "chuyenvien.diachinh",
    roleLabel: "Chuyên viên Địa chính",
    name: "Vũ Đình Khôi",
    desc: "Thẩm định hồ sơ Đất đai - Xây dựng, lập Phiếu xin lỗi Mẫu 04",
  },
  {
    username: "lanhdao",
    roleLabel: "Chủ tịch UBND (Lãnh đạo)",
    name: "Trần Quốc Bảo",
    desc: "Ký duyệt kết quả TTHC, bút phê phân công văn bản đến & giám sát SLA",
  },
  {
    username: "quantri",
    roleLabel: "Chánh VP - Quản trị & Văn thư",
    name: "Nguyễn Văn Minh",
    desc: "Quản trị danh mục TTHC, vào sổ văn bản đến/đi & nhật ký kiểm toán",
  },
  {
    username: "congdan",
    roleLabel: "Tài khoản Công dân",
    name: "Hoàng Minh Tuấn",
    desc: "Nộp hồ sơ trực tuyến, bổ sung tài liệu, thanh toán phí & đánh giá",
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const safeRedirect =
    redirectPath && redirectPath.startsWith("/") && !redirectPath.startsWith("//")
      ? redirectPath
      : null;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function performLogin(u: string, p: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đăng nhập thất bại");
        setLoading(false);
        return;
      }

      if (safeRedirect) {
        router.push(safeRedirect);
      } else if (data.user.role === "CONG_DAN") {
        router.push("/ho-so-cua-toi");
      } else {
        router.push("/he-thong");
      }
      router.refresh();
    } catch {
      setError("Không thể kết nối máy chủ xác thực.");
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    performLogin(username, password);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 bg-[#fffdf5] border-2 border-[#ce1126] p-6 rounded-[2px] relative overflow-hidden">
        <div className="absolute -right-14 -bottom-14 pointer-events-none">
          <BronzeDrumWatermark size={210} className="opacity-[0.12]" />
        </div>
        <div className="relative z-10 flex items-center gap-2.5 border-b border-[#e5c56b] pb-3 mb-5">
          <Shield className="w-6 h-6 text-[#ce1126]" />
          <div>
            <h1 className="text-lg font-bold text-[#991b1b] uppercase font-official-serif">
              Xác thực Định danh Hệ thống
            </h1>
            <p className="text-xs text-[#4b5563]">Dành cho Cán bộ, Công chức và Công dân</p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-[#fef2f2] border border-[#dc2626] text-xs text-[#991b1b] font-medium rounded-[2px]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-[#111827] mb-1">
              Tên tài khoản hoặc Thư điện tử công vụ
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên tài khoản..."
              className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] focus:outline-none focus:border-[#991b1b]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-[#111827] mb-1">
              Mật khẩu xác thực
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] focus:outline-none focus:border-[#991b1b]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-60 text-white rounded-[2px] cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            {loading ? "Đang xác thực..." : "Đăng nhập Hệ thống"}
          </button>
        </form>
      </div>

      {/* Bảng tài khoản vận hành thực tế 5 vai trò */}
      <div className="lg:col-span-7 bg-white border border-[#e5c56b] p-6 rounded-[2px] relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <LacBirdEmblem size={30} />
            <UserCog className="w-5 h-5 text-[#ce1126]" />
            <h2 className="text-base font-bold text-[#991b1b] uppercase font-official-serif">
              Danh sách Tài khoản Phân quyền Nghiệp vụ (5 Vai trò)
            </h2>
          </div>
          <span className="text-xs bg-[#fef3c7] text-[#78350f] px-2 py-0.5 border border-[#f59e0b] font-semibold rounded-[2px] tabular-nums">
            Mật khẩu chung: HanhChinh@2026
          </span>
        </div>

        <p className="text-xs text-[#4b5563] mb-4">
          Bấm chọn trực tiếp một vai trò dưới đây để đăng nhập nhanh và kiểm tra luồng phân quyền nghiệp vụ khép kín:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.username}
              type="button"
              disabled={loading}
              onClick={() => {
                setUsername(acc.username);
                setPassword("HanhChinh@2026");
                performLogin(acc.username, "HanhChinh@2026");
              }}
              className="text-left p-3.5 border border-[#d6d3cd] hover:border-[#991b1b] hover:bg-[#fffdf5] rounded-[2px] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#991b1b] uppercase">{acc.roleLabel}</span>
                <code className="text-[11px] bg-[#f3f4f6] px-1.5 py-0.5 rounded-[2px] text-[#111827]">
                  {acc.username}
                </code>
              </div>
              <p className="font-semibold text-sm text-[#111827] mt-1">{acc.name}</p>
              <p className="text-xs text-[#4b5563] mt-1 leading-snug">{acc.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="p-10 text-center text-sm">Đang tải trang đăng nhập...</div>}>
          <LoginContent />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
