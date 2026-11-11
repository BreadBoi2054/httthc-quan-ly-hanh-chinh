import React from "react";
import Link from "next/link";
import { AdminEmblem } from "./AdminEmblem";

export function PublicFooter() {
  return (
    <footer className="no-print mt-auto bg-[#1e293b] text-slate-200 border-t-4 border-[#991b1b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-6 space-y-2">
          <div className="flex items-center gap-3">
            <AdminEmblem size={38} />
            <div>
              <p className="text-xs uppercase tracking-wider text-[#fcd34d] font-semibold">
                CƠ QUAN VẬN HÀNH HỆ THỐNG NỘI BỘ
              </p>
              <p className="font-bold text-white text-base font-official-serif">
                TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG - UBND PHƯỜNG TÂN BÌNH
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-300 pt-1">
            Trụ sở tiếp công dân: Tầng 1, Khu Hành chính tập trung Phường Tân Bình (Quầy Một cửa số 01 - 04).
          </p>
          <p className="text-xs text-slate-400 tabular-nums">
            Điện thoại trực ban: (028) 3811 0101 • Thư điện tử nội bộ: tiepnhan@httthc.noibo.vn • Tên miền vận hành: httthc.noibo.vn
          </p>
        </div>

        <div className="md:col-span-3 space-y-2 text-sm">
          <p className="font-semibold text-[#fde68a] uppercase text-xs tracking-wider">
            Chuyên mục Nghiệp vụ
          </p>
          <ul className="space-y-1.5 text-slate-300">
            <li>
              <Link href="/thu-tuc" className="hover:text-white underline-offset-4 hover:underline">
                Danh mục Thủ tục hành chính
              </Link>
            </li>
            <li>
              <Link href="/nop-ho-so" className="hover:text-white underline-offset-4 hover:underline">
                Nộp hồ sơ trực tuyến
              </Link>
            </li>
            <li>
              <Link href="/tra-cuu" className="hover:text-white underline-offset-4 hover:underline">
                Tra cứu tiến độ &amp; Biên nhận
              </Link>
            </li>
            <li>
              <Link href="/so-tay-nghiep-vu" className="hover:text-white underline-offset-4 hover:underline">
                Sổ tay hướng dẫn nghiệp vụ
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-2 text-sm">
          <p className="font-semibold text-[#fde68a] uppercase text-xs tracking-wider">
            Căn cứ Quy chuẩn Nghiệp vụ
          </p>
          <ul className="space-y-1 text-xs text-slate-300">
            <li>- Cơ chế Một cửa, một cửa liên thông (NĐ 61/2018 &amp; NĐ 107/2021)</li>
            <li>- Công tác văn thư &amp; lưu trữ điện tử (NĐ 30/2020)</li>
            <li>- Bộ chỉ số phục vụ người dân &amp; doanh nghiệp (QĐ 766)</li>
          </ul>
        </div>
      </div>

      <div className="bg-[#0f172a] py-3 text-center text-xs text-slate-400 border-t border-slate-800">
        © 2026 Hệ thống Thông tin Quản lý Hành chính &amp; Một cửa Điện tử (HTTTHC). Vận hành độc lập phục vụ quản lý nghiệp vụ hành chính.
      </div>
    </footer>
  );
}
