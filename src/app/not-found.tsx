import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { ArrowLeft, Search, ShieldAlert } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f0]">
      <PublicHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-16">
        <div className="bg-white border-2 border-[#991b1b] p-8 rounded-[2px] text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-[#fef2f2] border border-[#fca5a5] flex items-center justify-center rounded-[2px]">
            <ShieldAlert className="w-6 h-6 text-[#991b1b]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#991b1b]">
            Mã thông báo HTTP 404 • Không tìm thấy trang yêu cầu
          </p>
          <h1 className="text-2xl font-bold text-[#111827] font-official-serif">
            Đường dẫn truy cập không tồn tại hoặc đã thay đổi
          </h1>
          <p className="text-sm text-[#4b5563] max-w-xl mx-auto">
            Chuyên mục hoặc hồ sơ ông/bà đang tìm kiếm không tồn tại trên Hệ thống Thông tin Quản lý Hành chính &amp; Một cửa Điện tử. Vui lòng sử dụng các chức năng chính dưới đây.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase bg-[#991b1b] text-white hover:bg-[#7f1d1d] rounded-[2px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Về Trang chủ Cổng DVC
            </Link>
            <Link
              href="/tra-cuu"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase border border-[#ce1126] text-[#991b1b] hover:bg-[#fef2f2] rounded-[2px]"
            >
              <Search className="w-4 h-4" />
              Tra cứu Tiến độ Hồ sơ
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
