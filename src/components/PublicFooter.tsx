import React from "react";
import Link from "next/link";
import { AdminEmblem, BronzeDrumWatermark, DongSonFretStrip } from "./AdminEmblem";

export function PublicFooter() {
  return (
    <footer className="no-print mt-auto bg-[#fce8a6] text-[#3f1d14] border-t-4 border-[#ce1126] relative overflow-hidden">
      <DongSonFretStrip className="relative z-10 border-t-0" />
      <div className="absolute -right-16 -bottom-20 hidden md:block">
        <BronzeDrumWatermark size={310} className="opacity-[0.15]" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
        <div className="md:col-span-6 space-y-2">
          <div className="flex items-center gap-3">
            <AdminEmblem size={42} />
            <div>
              <p className="text-xs uppercase tracking-wider text-[#881318] font-bold">
                CƠ QUAN VẬN HÀNH HỆ THỐNG NỘI BỘ
              </p>
              <p className="font-bold text-[#ce1126] text-base font-official-serif">
                TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG - UBND PHƯỜNG THANH NHÀN
              </p>
            </div>
          </div>
          <p className="text-sm text-[#4a2518] pt-1">
            Trụ sở tiếp công dân: Số 132 Phố Thanh Nhàn, Phường Thanh Nhàn, Thành phố Hà Nội (Quầy Một cửa số 01 - 04).
          </p>
          <p className="text-xs text-[#6b3420] tabular-nums font-medium">
            Điện thoại trực ban: (024) 3971 0101 • Thư điện tử nội bộ: tiepnhan@httthc.noibo.vn • Tên miền vận hành: httthc.noibo.vn
          </p>
        </div>

        <div className="md:col-span-3 space-y-2 text-sm">
          <p className="font-bold text-[#991b1b] uppercase text-xs tracking-wider">
            Chuyên mục Nghiệp vụ
          </p>
          <ul className="space-y-1.5 text-[#3f1d14] font-medium">
            <li>
              <Link href="/thu-tuc" className="hover:text-[#ce1126] underline-offset-4 hover:underline">
                Danh mục Thủ tục hành chính
              </Link>
            </li>
            <li>
              <Link href="/nop-ho-so" className="hover:text-[#ce1126] underline-offset-4 hover:underline">
                Nộp hồ sơ trực tuyến
              </Link>
            </li>
            <li>
              <Link href="/tra-cuu" className="hover:text-[#ce1126] underline-offset-4 hover:underline">
                Tra cứu tiến độ &amp; Biên nhận
              </Link>
            </li>
            <li>
              <Link href="/so-tay-nghiep-vu" className="hover:text-[#ce1126] underline-offset-4 hover:underline">
                Sổ tay hướng dẫn nghiệp vụ
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-2 text-sm">
          <p className="font-bold text-[#991b1b] uppercase text-xs tracking-wider">
            Căn cứ Quy chuẩn Nghiệp vụ
          </p>
          <ul className="space-y-1 text-xs text-[#4a2518]">
            <li>- Cơ chế Một cửa, một cửa liên thông (NĐ 61/2018 &amp; NĐ 107/2021)</li>
            <li>- Thực hiện TTHC điện tử &amp; Kho dữ liệu số (NĐ 45/2020)</li>
            <li>- Công tác văn thư &amp; lưu trữ điện tử (NĐ 30/2020)</li>
            <li>- Bộ chỉ số phục vụ người dân &amp; doanh nghiệp (QĐ 766)</li>
          </ul>
        </div>
      </div>

      <div className="bg-[#991b1b] py-3 text-center text-xs text-[#fef3c7] border-t border-[#7f1d1d]">
        © 2026 Cổng Dịch vụ công &amp; Hệ thống Thông tin Quản lý Hành chính — UBND Phường Thanh Nhàn.
      </div>
    </footer>
  );
}
