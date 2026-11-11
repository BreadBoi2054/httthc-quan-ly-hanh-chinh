"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { CulturalSubpageBanner } from "@/components/AdminEmblem";
import { Search, FilePlus2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

interface ProcedureItem {
  id: string;
  code: string;
  name: string;
  field: string;
  serviceLevel: "MOT_PHAN" | "TOAN_TRINH";
  processingDays: number;
  processingHours: number;
  feeAmount: number;
  feePerCopy?: boolean;
  feeExemptionNote?: string | null;
  legalBasis: string;
  executionSteps: string;
  resultTemplate: string;
  requiredDocs: Array<{ code: string; name: string; mandatory: boolean }>;
  department: { name: string; roomNumber: string };
}

function ProceduresCatalogContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [q, setQ] = useState(initialQ);
  const [field, setField] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/procedures")
      .then((r) => r.json())
      .then((data) => {
        const list: ProcedureItem[] = data.procedures || [];
        setProcedures(list);
        if (initialQ && list.length > 0) {
          const matched = list.find((p) => p.code.includes(initialQ) || p.name.toLowerCase().includes(initialQ.toLowerCase()));
          if (matched) setExpandedId(matched.id);
        }
      })
      .finally(() => setLoading(false));
  }, [initialQ]);

  const fields = Array.from(new Set(procedures.map((p) => p.field)));

  const filtered = procedures.filter((p) => {
    if (field !== "ALL" && p.field !== field) return false;
    if (level !== "ALL" && p.serviceLevel !== level) return false;
    if (q.trim()) {
      const kw = q.trim().toLowerCase();
      return (
        p.code.toLowerCase().includes(kw) ||
        p.name.toLowerCase().includes(kw) ||
        p.field.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const hasActiveFilter = Boolean(q.trim() || field !== "ALL" || level !== "ALL");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <CulturalSubpageBanner
        eyebrow="CỔNG DỊCH VỤ CÔNG UBND PHƯỜNG THANH NHÀN"
        title="Cơ sở dữ liệu Danh mục Thủ tục Hành chính Chuẩn hóa"
        description="Công khai đầy đủ trình tự thực hiện, thành phần hồ sơ, thời hạn giải quyết, mức phí và căn cứ pháp lý."
      />

      {/* Bộ lọc tra cứu TTHC */}
      <div className="bg-white border border-[#d6d3cd] p-4 rounded-[2px] space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <label htmlFor="proc-search" className="block text-xs font-semibold text-[#111827] mb-1">
              Từ khóa hoặc Mã Thủ tục hành chính
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#4b5563] absolute left-3 top-2.5" />
              <input
                id="proc-search"
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nhập mã TTHC (ví dụ: 1.001193) hoặc tên thủ tục..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] focus:outline-none focus:border-[#991b1b]"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="proc-field" className="block text-xs font-semibold text-[#111827] mb-1">
              Lĩnh vực chuyên môn
            </label>
            <select
              id="proc-field"
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] bg-white focus:outline-none focus:border-[#991b1b]"
            >
              <option value="ALL">Tất cả lĩnh vực ({procedures.length})</option>
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="proc-level" className="block text-xs font-semibold text-[#111827] mb-1">
              Mức độ dịch vụ công
            </label>
            <select
              id="proc-level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#9ca3af] rounded-[2px] bg-white focus:outline-none focus:border-[#991b1b]"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="TOAN_TRINH">DVC Trực tuyến Toàn trình</option>
              <option value="MOT_PHAN">DVC Trực tuyến Một phần</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f3f4f6] text-xs text-[#4b5563]">
          <span className="tabular-nums">
            Hiển thị <strong className="text-[#111827]">{filtered.length}</strong> /{" "}
            <strong className="text-[#111827]">{procedures.length}</strong> thủ tục hành chính công khai
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setField("ALL");
                setLevel("ALL");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#991b1b] bg-[#fef2f2] border border-[#fca5a5] hover:bg-[#fee2e2] rounded-[2px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng danh mục */}
      {loading ? (
        <div className="bg-white border border-[#d6d3cd] p-8 text-center text-sm text-[#4b5563]">
          Đang tải danh mục Thủ tục hành chính...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#d6d3cd] p-8 text-center text-sm text-[#4b5563]">
          Không tìm thấy thủ tục hành chính phù hợp với điều kiện lọc.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((proc) => {
            const isOpen = expandedId === proc.id;
            return (
              <div key={proc.id} className="bg-white border border-[#d6d3cd] rounded-[2px]">
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold bg-[#ce1126] text-white px-2 py-0.5 rounded-[2px] tabular-nums">
                        Mã TTHC: {proc.code}
                      </span>
                      <span className="text-xs font-semibold bg-[#f3f4f6] text-[#111827] px-2 py-0.5 border border-[#d1d5db] rounded-[2px]">
                        {proc.field}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-[2px] border ${
                          proc.serviceLevel === "TOAN_TRINH"
                            ? "bg-[#dcfce7] text-[#166534] border-[#86efac]"
                            : "bg-[#fef3c7] text-[#92400e] border-[#fcd34d]"
                        }`}
                      >
                        {proc.serviceLevel === "TOAN_TRINH" ? "DVC Toàn trình" : "DVC Một phần"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#111827]">{proc.name}</h3>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#4b5563] tabular-nums">
                      <span>
                        Cơ quan thực hiện: <strong className="text-[#111827]">{proc.department.name}</strong>
                      </span>
                      <span>
                        Thời hạn giải quyết:{" "}
                        <strong className="text-[#991b1b]">
                          {proc.processingDays === 0
                            ? `Trong ngày (${proc.processingHours} giờ làm việc)`
                            : `${proc.processingDays} ngày làm việc (${proc.processingHours} giờ)`}
                        </strong>
                      </span>
                      <span>
                        Lệ phí:{" "}
                        <strong className="text-[#111827]">
                          {proc.feeAmount === 0
                            ? "Miễn lệ phí (0 đồng)"
                            : `${proc.feeAmount.toLocaleString("vi-VN")} đồng${proc.feePerCopy ? "/bản" : ""}`}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setExpandedId(isOpen ? null : proc.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold border border-[#9ca3af] hover:bg-[#f9fafb] text-[#111827] rounded-[2px] cursor-pointer"
                    >
                      {isOpen ? (
                        <>
                          Thu gọn <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Chi tiết thành phần &amp; căn cứ <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <Link
                      href={`/nop-ho-so?procedureId=${proc.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-[2px]"
                    >
                      <FilePlus2 className="w-3.5 h-3.5" />
                      Nộp trực tuyến
                    </Link>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-[#e5e7eb] bg-[#fffdf5] p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-sm">
                    <div className="lg:col-span-6 space-y-3">
                      <div>
                        <p className="font-bold text-xs uppercase text-[#991b1b] mb-1">
                          1. Trình tự các bước thực hiện
                        </p>
                        <pre className="whitespace-pre-wrap font-sans text-xs text-[#1f2937] bg-white p-3 border border-[#e5e7eb] rounded-[2px] leading-relaxed">
                          {proc.executionSteps}
                        </pre>
                      </div>
                      <div>
                        <p className="font-bold text-xs uppercase text-[#991b1b] mb-1">
                          2. Căn cứ pháp lý &amp; Chính sách miễn giảm lệ phí
                        </p>
                        <div className="bg-white p-3 border border-[#e5e7eb] rounded-[2px] text-xs space-y-1.5">
                          <p>
                            <strong>Căn cứ pháp lý:</strong> {proc.legalBasis}
                          </p>
                          <p>
                            <strong>Chính sách lệ phí:</strong> {proc.feeExemptionNote || "Thu theo quy định hiện hành."}
                          </p>
                          <p>
                            <strong>Kết quả giải quyết:</strong> {proc.resultTemplate}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-6">
                      <p className="font-bold text-xs uppercase text-[#991b1b] mb-1">
                        3. Thành phần hồ sơ quy định ({proc.requiredDocs.length} đầu mục)
                      </p>
                      <table className="w-full text-xs bg-white border border-[#d6d3cd] border-collapse">
                        <thead>
                          <tr className="bg-[#f3f4f6] text-left">
                            <th className="border border-[#d6d3cd] px-2.5 py-1.5">Mã giấy tờ</th>
                            <th className="border border-[#d6d3cd] px-2.5 py-1.5">Tên thành phần tài liệu</th>
                            <th className="border border-[#d6d3cd] px-2.5 py-1.5 text-center">Yêu cầu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proc.requiredDocs.map((doc) => (
                            <tr key={doc.code}>
                              <td className="border border-[#d6d3cd] px-2.5 py-2 font-mono text-[11px]">{doc.code}</td>
                              <td className="border border-[#d6d3cd] px-2.5 py-2">{doc.name}</td>
                              <td className="border border-[#d6d3cd] px-2.5 py-2 text-center">
                                {doc.mandatory ? (
                                  <span className="text-[#991b1b] font-bold">Bắt buộc</span>
                                ) : (
                                  <span className="text-[#4b5563]">Nếu có</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProceduresPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center text-sm">Đang tải danh mục...</div>}>
          <ProceduresCatalogContent />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
