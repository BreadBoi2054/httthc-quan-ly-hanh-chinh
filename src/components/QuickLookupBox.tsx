"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

export function QuickLookupBox() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    const params = new URLSearchParams({ code: code.trim().toUpperCase() });
    if (pin.trim()) params.set("pin", pin.trim());
    router.push(`/tra-cuu?${params.toString()}`);
  }

  const sampleCodes = [
    { code: "HS-20261110-0005", pin: "391042", label: "Khai sinh (Chờ ký duyệt)" },
    { code: "HS-20261109-0004", pin: "845129", label: "Hộ KD (Yêu cầu bổ sung)" },
    { code: "HS-20261028-0007", pin: "904215", label: "GPXD (Đã hoàn thành)" },
  ];

  return (
    <div className="bg-white border-2 border-[#ce1126] p-5 sm:p-6 rounded-[2px]">
      <div className="border-b border-[#e5e7eb] pb-3 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-[#ce1126] uppercase tracking-tight font-official-serif">
          Tra cứu trực tuyến Tiến độ Hồ sơ Một cửa
        </h2>
        <p className="text-xs text-[#4b5563] mt-0.5">
          Nhập Mã số biên nhận hồ sơ (in trên Giấy tiếp nhận Mẫu 01) và Mã PIN (nếu cần in biểu mẫu / nộp bổ sung).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6">
          <label htmlFor="quick-code" className="block text-xs font-semibold text-[#111827] mb-1">
            Mã số biên nhận hồ sơ <span className="text-[#ce1126]">*</span>
          </label>
          <input
            id="quick-code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ví dụ: HS-20261111-0001"
            className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] bg-white focus:outline-none focus:border-[#ce1126] tabular-nums"
          />
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="quick-pin" className="block text-xs font-semibold text-[#111827] mb-1">
            Mã PIN bảo mật (tùy chọn)
          </label>
          <input
            id="quick-pin"
            type="text"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="6 chữ số"
            className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] bg-white focus:outline-none focus:border-[#ce1126] tabular-nums"
          />
        </div>

        <div className="sm:col-span-3 flex items-end">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#d71920] hover:bg-[#a60e1f] text-white rounded-[2px] cursor-pointer transition-colors"
          >
            <Search className="w-4 h-4" />
            Tra cứu ngay
          </button>
        </div>
      </form>

      <div className="mt-3 pt-3 border-t border-[#f3f4f6] flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[#4b5563] font-medium">Mã hồ sơ mẫu kiểm thử nhanh:</span>
        {sampleCodes.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => router.push(`/tra-cuu?code=${item.code}&pin=${item.pin}`)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-[#fef3c7] hover:bg-[#fde68a] text-[#78350f] border border-[#f59e0b]/60 rounded-[2px] font-medium tabular-nums cursor-pointer"
          >
            {item.code} ({item.label})
            <ArrowRight className="w-3 h-3" />
          </button>
        ))}
      </div>
    </div>
  );
}
