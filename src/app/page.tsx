import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { evaluateDossierSla } from "@/lib/sla-engine";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { QuickLookupBox } from "@/components/QuickLookupBox";
import {
  BronzeDrumWatermark,
  DongSonFretStrip,
  LacBirdEmblem,
  LotusGardenStrip,
} from "@/components/AdminEmblem";
import { FilePlus2, CheckCircle2, Clock, ShieldCheck, ArrowRight, BookOpen, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [procedures, dossiers] = await Promise.all([
    prisma.procedure.findMany({
      where: { isActive: true },
      include: { department: true },
      orderBy: [{ field: "asc" }, { code: "asc" }],
    }),
    prisma.dossier.findMany({
      include: {
        attachments: { select: { submittedType: true, reusedFromVault: true } },
      },
    }),
  ]);

  const now = new Date();
  let completedTotal = 0;
  let completedOnTime = 0;
  let overdueActive = 0;
  let onlineCount = 0;
  let paidFeeDossiers = 0;
  let onlinePaidDossiers = 0;
  let digitizedInputDossiers = 0;
  let signedOrCompletedTotal = 0;
  let digitizedResultDossiers = 0;
  let ratedCount = 0;
  let positiveRatedCount = 0;

  for (const d of dossiers) {
    if (d.channel === "TRUC_TUYEN") onlineCount += 1;
    if (d.feeStatus === "DA_THU_PHI") {
      paidFeeDossiers += 1;
      if (d.paymentMethod === "TRUC_TUYEN") onlinePaidDossiers += 1;
    }
    if (d.attachments.some((att) => att.submittedType === "BAN_DIEN_TU" || att.reusedFromVault)) {
      digitizedInputDossiers += 1;
    }
    if (d.status === "CHO_TRA_KET_QUA" || d.status === "HOAN_THANH") {
      signedOrCompletedTotal += 1;
      if (d.isDigitizedResult) digitizedResultDossiers += 1;
    }
    if (d.satisfactionRating) {
      ratedCount += 1;
      if (d.satisfactionRating === "RAT_HAI_LONG" || d.satisfactionRating === "HAI_LONG") {
        positiveRatedCount += 1;
      }
    }
    const sla = evaluateDossierSla({
      status: d.status,
      dueAt: d.dueAt,
      completedAt: d.completedAt,
      slaPausedAt: d.slaPausedAt,
      supplementDeadline: d.supplementDeadline,
      now,
    });
    if (d.status === "HOAN_THANH") {
      completedTotal += 1;
      if (sla.state === "DA_HOAN_THANH_DUNG_HAN") completedOnTime += 1;
    } else if (d.status !== "TU_CHOI_TIEP_NHAN" && d.status !== "DA_RUT_HO_SO") {
      if (sla.isOverdue) overdueActive += 1;
    }
  }

  const transparencyRate = procedures.length > 0 ? 100 : 0;
  const onTimeRate =
    completedTotal + overdueActive > 0
      ? Math.round((completedOnTime / (completedTotal + overdueActive)) * 1000) / 10
      : 100;
  const onlineRate =
    dossiers.length > 0 ? Math.round((onlineCount / dossiers.length) * 1000) / 10 : 0;
  const onlinePaymentRate =
    paidFeeDossiers > 0 ? Math.round((onlinePaidDossiers / paidFeeDossiers) * 1000) / 10 : 100;
  const onlineAndPaymentRate = Math.round(((onlineRate + onlinePaymentRate) / 2) * 10) / 10;
  const inputDigitizationRate =
    dossiers.length > 0 ? (digitizedInputDossiers / dossiers.length) * 100 : 100;
  const resultDigitizationRate =
    signedOrCompletedTotal > 0 ? (digitizedResultDossiers / signedOrCompletedTotal) * 100 : 100;
  const digitizationRate = Math.round(((inputDigitizationRate + resultDigitizationRate) / 2) * 10) / 10;
  const satisfactionRate =
    ratedCount > 0 ? Math.round((positiveRatedCount / ratedCount) * 1000) / 10 : 100;

  const overall766Score =
    Math.round(
      (transparencyRate * 0.18 +
        onTimeRate * 0.2 +
        onlineAndPaymentRate * 0.22 +
        digitizationRate * 0.22 +
        satisfactionRate * 0.18) *
        10
    ) / 10;

  const fields = Array.from(new Set(procedures.map((p) => p.field)));

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 bg-white">
        {/* Khung thông điệp hành chính & Tra cứu hồ sơ trên nền Vàng kem + Trống đồng Đông Sơn + Đầm sen */}
        <section className="bg-[#fff1bd] border-b border-[#e5c56b] pt-7 relative overflow-hidden">
          {/* Họa tiết Trống đồng Ngọc Lũ – Đông Sơn cỡ lớn ẩn hiện phía sau nền Vàng kem */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-16 hidden md:block">
            <BronzeDrumWatermark size={520} className="opacity-[0.15]" />
          </div>
          <div className="absolute -left-28 top-6 hidden xl:block">
            <BronzeDrumWatermark size={300} className="opacity-[0.10]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-[#fffbeb]/92 border border-[#e5c56b] border-l-4 border-l-[#ce1126] p-5 rounded-[2px] relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <LacBirdEmblem size={28} />
                  <p className="text-xs font-bold uppercase tracking-wider text-[#ce1126]">
                    CƠ CHẾ MỘT CỬA, MỘT CỬA LIÊN THÔNG ĐIỆN TỬ • PHƯỜNG THANH NHÀN
                  </p>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#991b1b] font-official-serif mt-1">
                  Công khai quy trình • Đúng hạn pháp luật • Lấy sự hài lòng làm thước đo
                </h1>
                <p className="text-sm text-[#4a2518] mt-2 leading-relaxed">
                  Hệ thống tiếp nhận, luân chuyển thẩm định, ký duyệt kết quả và giám sát thời hạn giải quyết Thủ tục hành chính theo thời gian thực (tự động loại trừ ngày nghỉ cuối tuần, lễ tết và ghi nhận tạm dừng/gia hạn minh bạch).
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/nop-ho-so"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-[#d71920] hover:bg-[#a60e1f] text-white rounded-[2px] transition-colors"
                  >
                    <FilePlus2 className="w-4 h-4" />
                    Nộp hồ sơ trực tuyến
                  </Link>
                  <Link
                    href="/thu-tuc"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white hover:bg-[#fef2f2] text-[#b91c1c] border border-[#ce1126] rounded-[2px] transition-colors"
                  >
                    Xem {procedures.length} Thủ tục hành chính
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/so-tay-nghiep-vu"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white hover:bg-[#fffbeb] text-[#78350f] border border-[#d97706] rounded-[2px] transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-[#d97706]" />
                    Sổ tay nghiệp vụ
                  </Link>
                </div>
              </div>

              <QuickLookupBox />
            </div>

            {/* Bảng công khai 5 Nhóm Chỉ số Quyết định 766/QĐ-TTg thời gian thực */}
            <div className="lg:col-span-5 bg-white border border-[#e5c56b] rounded-[2px] overflow-hidden">
              <div className="bg-[#ce1126] text-white px-5 py-3.5 border-b-2 border-[#f59e0b] flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#fef08a] font-semibold">
                    BỘ CHỈ SỐ PHỤC VỤ NGƯỜI DÂN (QUYẾT ĐỊNH 766/QĐ-TTG)
                  </p>
                  <h2 className="text-sm font-bold mt-0.5">
                    Tổng điểm đối soát thời gian thực: {overall766Score}/100 điểm
                  </h2>
                </div>
                <ShieldCheck className="w-6 h-6 text-[#fde047] shrink-0" />
              </div>

              <div className="divide-y divide-[#e5e7eb] text-sm">
                <div className="p-4 grid grid-cols-2 gap-4 bg-[#fffdf5]">
                  <div>
                    <p className="text-xs text-[#4b5563]">Tiến độ giải quyết đúng hạn</p>
                    <p className="text-2xl font-bold text-[#15803d] tabular-nums mt-0.5">{onTimeRate}%</p>
                    <p className="text-[11px] text-[#4b5563] tabular-nums">
                      {completedOnTime}/{completedTotal + overdueActive} đúng hạn ({overdueActive} đang quá hạn)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4b5563]">Mức độ hài lòng (SIPAS)</p>
                    <p className="text-2xl font-bold text-[#ce1126] tabular-nums mt-0.5">{satisfactionRate}%</p>
                    <p className="text-[11px] text-[#4b5563] tabular-nums">
                      {positiveRatedCount}/{ratedCount} lượt đánh giá tích cực
                    </p>
                  </div>
                </div>

                <div className="px-5 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[#374151]">1. Công khai, minh bạch TTHC</span>
                  <strong className="tabular-nums text-[#15803d]">{transparencyRate}% ({procedures.length} TTHC)</strong>
                </div>
                <div className="px-5 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[#374151]">3. DVC trực tuyến &amp; Thanh toán số</span>
                  <strong className="tabular-nums text-[#b91c1c]">
                    {onlineAndPaymentRate}% (Nộp {onlineRate}% • Phí ĐT {onlinePaymentRate}%)
                  </strong>
                </div>
                <div className="px-5 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[#374151]">4. Số hóa hồ sơ &amp; Kết quả điện tử</span>
                  <strong className="tabular-nums text-[#15803d]">
                    {digitizationRate}% ({digitizedResultDossiers}/{signedOrCompletedTotal} KQĐT)
                  </strong>
                </div>
                <div className="px-5 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[#374151]">Tổng số hồ sơ phát sinh trên hệ thống</span>
                  <strong className="tabular-nums text-[#111827]">{dossiers.length} hồ sơ</strong>
                </div>
              </div>
            </div>
          </div>

          <LotusGardenStrip />
        </section>

        {/* Danh mục Thủ tục Hành chính tiêu biểu theo lĩnh vực (Nền trắng tinh khiết + Biểu tượng Chim Lạc) */}
        <section className="bg-white max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-2 border-[#ce1126] pb-3 mb-6">
            <div className="flex items-start sm:items-center gap-3">
              <LacBirdEmblem size={42} className="mt-0.5 sm:mt-0" />
              <div>
                <h2 className="text-xl font-bold text-[#ce1126] uppercase font-official-serif">
                  Danh mục Thủ tục Hành chính Công bố Thực hiện
                </h2>
                <p className="text-sm text-[#4b5563] mt-0.5">
                  Tra cứu căn cứ pháp lý, thành phần hồ sơ bắt buộc, mức lệ phí và nộp trực tuyến ngay.
                </p>
              </div>
            </div>
            <Link
              href="/thu-tuc"
              className="text-sm font-semibold text-[#b91c1c] hover:text-[#7f1d1d] inline-flex items-center gap-1"
            >
              Xem toàn bộ chi tiết quy trình <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fields.map((field) => {
              const items = procedures.filter((p) => p.field === field);
              return (
                <div key={field} className="bg-white border border-[#e5e7eb] rounded-[2px] flex flex-col">
                  <div className="bg-[#fff8dc] px-4 py-3 border-b border-[#e5c56b] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#ce1126]" />
                      <h3 className="font-bold text-sm uppercase text-[#881318]">{field}</h3>
                    </div>
                    <span className="text-xs font-semibold text-[#78350f] bg-white px-2 py-0.5 border border-[#d97706]/50 rounded-[2px] tabular-nums">
                      {items.length} thủ tục
                    </span>
                  </div>
                  <div className="divide-y divide-[#e5e7eb] flex-1">
                    {items.map((proc) => (
                      <div key={proc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#fafafa] transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#991b1b] bg-[#fef2f2] border border-[#fecaca] px-1.5 py-0.5 rounded-[2px] tabular-nums">
                              Mã: {proc.code}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-[2px] border ${
                                proc.serviceLevel === "TOAN_TRINH"
                                  ? "bg-[#dcfce7] text-[#166534] border-[#86efac]"
                                  : "bg-[#fef3c7] text-[#92400e] border-[#fcd34d]"
                              }`}
                            >
                              {proc.serviceLevel === "TOAN_TRINH" ? "Toàn trình" : "Một phần"}
                            </span>
                          </div>
                          <Link
                            href={`/thu-tuc?q=${proc.code}`}
                            className="font-semibold text-sm text-[#111827] hover:text-[#ce1126] block"
                          >
                            {proc.name}
                          </Link>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#4b5563] tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#ce1126]" />
                              {proc.processingDays === 0
                                ? `Trong ngày (${proc.processingHours}h làm việc)`
                                : `${proc.processingDays} ngày làm việc`}
                            </span>
                            <span>•</span>
                            <span>
                              Lệ phí:{" "}
                              <strong>
                                {proc.feeAmount === 0
                                  ? "Miễn phí (0 đ)"
                                  : `${proc.feeAmount.toLocaleString("vi-VN")} đ${proc.feePerCopy ? "/bản" : ""}`}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/nop-ho-so?procedureId=${proc.id}`}
                          className="shrink-0 inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold bg-[#d71920] hover:bg-[#a60e1f] text-white rounded-[2px] transition-colors"
                        >
                          Nộp hồ sơ
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <DongSonFretStrip />

        {/* Sơ đồ 5 bước quy trình Một cửa chuẩn pháp lý (Nền xám sáng phân lớp như cổng mẫu) */}
        <section className="bg-[#f3f4f6] py-10 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex items-center gap-2.5 mb-5">
              <LacBirdEmblem size={36} />
              <h2 className="text-lg font-bold text-[#991b1b] uppercase font-official-serif">
                Quy trình Giải quyết Hồ sơ Chuẩn Cơ chế Một cửa Liên thông
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  step: "Bước 1",
                  title: "Nộp & Kiểm tra Hồ sơ",
                  desc: "Công dân nộp trực tuyến (tái sử dụng Kho dữ liệu số) hoặc tại Quầy Một cửa.",
                },
                {
                  step: "Bước 2",
                  title: "Tiếp nhận & Hẹn trả (Mẫu 01)",
                  desc: "Cán bộ Một cửa cấp Giấy tiếp nhận, tự động tính ngày hẹn trả trừ T7, CN và ngày lễ.",
                },
                {
                  step: "Bước 3",
                  title: "Thẩm định Chuyên môn",
                  desc: "Chuyên viên đối chiếu pháp lý; tạm dừng SLA tối đa 01 lần nếu chờ bổ sung (Mẫu 02).",
                },
                {
                  step: "Bước 4",
                  title: "Lãnh đạo Ký duyệt & Sổ VB",
                  desc: "Lãnh đạo UBND ký ban hành kết quả điện tử, tự động cấp số vào Sổ văn bản đi.",
                },
                {
                  step: "Bước 5",
                  title: "Thu lệ phí & Trả kết quả",
                  desc: "Kiểm soát hoàn thành nghĩa vụ lệ phí (Biên lai điện tử), trả kết quả và khảo sát SIPAS.",
                },
              ].map((s) => (
                <div key={s.step} className="border border-[#e5e7eb] bg-white p-4 rounded-[2px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-[#ce1126] bg-[#fef2f2] border border-[#fecaca] px-2 py-0.5 rounded-[2px]">
                      {s.step}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
                  </div>
                  <h3 className="font-bold text-sm text-[#111827]">{s.title}</h3>
                  <p className="text-xs text-[#4b5563] mt-1.5 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
