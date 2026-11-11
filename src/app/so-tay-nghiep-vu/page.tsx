import React from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { BookOpen, ShieldCheck, Clock, FileSpreadsheet, Users, CheckSquare } from "lucide-react";

export default function OperationalHandbookPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="border-b-2 border-[#991b1b] pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
            TÀI LIỆU HƯỚNG DẪN VẬN HÀNH CHUẨN HÓA (USER GUIDE v2.0)
          </p>
          <h1 className="text-2xl font-bold text-[#111827] font-official-serif mt-1">
            Sổ tay Nghiệp vụ Quản lý Hành chính &amp; Cơ chế Một cửa Liên thông
          </h1>
          <p className="text-sm text-[#4b5563] mt-1">
            Hướng dẫn chi tiết quy trình tác nghiệp dành cho Công dân/Tổ chức và 04 nhóm Cán bộ, Công chức nội bộ sau 7 vòng kiểm định chuyên sâu (kèm tệp{" "}
            <code className="bg-[#f3f4f6] px-1.5 py-0.5 rounded-[2px]">SO_TAY_NGHIEP_VU.md</code> tại thư mục gốc hệ thống).
          </p>
        </div>

        {/* Phần 1: Bảng phân vai RBAC */}
        <section className="bg-white border border-[#d6d3cd] p-6 rounded-[2px] space-y-4">
          <h2 className="text-base font-bold uppercase text-[#1e3a5f] flex items-center gap-2 font-official-serif">
            <Users className="w-5 h-5 text-[#991b1b]" />
            1. Phân quyền Trách nhiệm 05 Vai trò Nghiệp vụ (RBAC &amp; ABAC)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-[#d6d3cd] border-collapse">
              <thead>
                <tr className="bg-[#faf8f5] text-left">
                  <th className="border border-[#d6d3cd] px-3 py-2 w-40">Vai trò</th>
                  <th className="border border-[#d6d3cd] px-3 py-2 w-44">Tài khoản mẫu</th>
                  <th className="border border-[#d6d3cd] px-3 py-2">Thẩm quyền nghiệp vụ được phép</th>
                  <th className="border border-[#d6d3cd] px-3 py-2">Giới hạn kiểm soát (Chặn cứng)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[#d6d3cd] px-3 py-2 font-bold text-[#991b1b]">Công dân / Tổ chức</td>
                  <td className="border border-[#d6d3cd] px-3 py-2 font-mono">congdan / congdan2</td>
                  <td className="border border-[#d6d3cd] px-3 py-2">
                    Nộp hồ sơ trực tuyến, tái sử dụng giấy tờ từ Kho dữ liệu điện tử cá nhân (NĐ 45/2020), đính kèm bổ sung theo Mẫu 02, nộp lệ phí trực tuyến, rút hồ sơ trực tuyến 2 bước, đánh giá SIPAS.
                  </td>
                  <td className="border border-[#d6d3cd] px-3 py-2">
                    Chỉ xem hồ sơ của chính mình; tra cứu công khai bị che mờ CCCD/họ tên nếu không có Mã PIN 6 số; khảo sát SIPAS chỉ gửi 01 lần chống ghi đè.
                  </td>
                </tr>
                <tr>
                  <td className="border border-[#d6d3cd] px-3 py-2 font-bold text-[#1e3a5f]">Cán bộ Một cửa</td>
                  <td className="border border-[#d6d3cd] px-3 py-2 font-mono">motcua</td>
                  <td className="border border-[#d6d3cd] px-3 py-2">
                    Tiếp nhận 01 bước tại quầy &amp; tự động phân công chuyên viên ít việc nhất, cấp Giấy hẹn (Mẫu 01), Yêu cầu bổ sung tối đa 01 lần (Mẫu 02), Từ chối tiếp nhận (Mẫu 03), Thu lệ phí (nhân tự động theo số bản sao nếu có), Trả kết quả.
                  </td>
                  <td className="border border-[#d6d3cd] px-3 py-2">
                    Không được ký phê duyệt kết quả chuyên môn; không được truy cập Văn bản Mật/Tối mật nếu không được giao; bị chặn cứng Trả kết quả nếu chưa thu lệ phí.
                  </td>
                </tr>
                <tr>
                  <td className="border border-[#d6d3cd] px-3 py-2 font-bold text-[#1e3a5f]">Chuyên viên Thụ lý</td>
                  <td className="border border-[#d6d3cd] px-3 py-2 font-mono">
                    chuyenvien.tuphap<br />chuyenvien.diachinh<br />chuyenvien.vhxh<br />chuyenvien.kinhte
                  </td>
                  <td className="border border-[#d6d3cd] px-3 py-2">
                    Thụ lý thẩm định, điều chuyển chuyên viên cùng phòng, tích đối chiếu tính hợp pháp từng thành phần hồ sơ, lập ý kiến thẩm định trình Lãnh đạo, lập Phiếu xin lỗi &amp; gia hạn (Mẫu 04).
                  </td>
                  <td className="border border-[#d6d3cd] px-3 py-2">
                    Chuyên viên phòng nào chỉ được xử lý hồ sơ đúng phòng đó (ABAC); chưa đối chiếu đủ tài liệu bắt buộc thì không thể bấm Trình ký.
                  </td>
                </tr>
                <tr>
                  <td className="border border-[#d6d3cd] px-3 py-2 font-bold text-[#1e3a5f]">Lãnh đạo UBND</td>
                  <td className="border border-[#d6d3cd] px-3 py-2 font-mono">lanhdao</td>
                  <td className="border border-[#d6d3cd] px-3 py-2">
                    Ký duyệt kết quả TTHC (cấp mã kết quả điện tử <code>KQĐT-UBND-...</code> &amp; ghi Sổ văn bản đi), trả lại chuyên viên thẩm định lại, bút phê Văn bản đến, trả lại dự thảo hoặc ký ban hành Văn bản đi (cấp Số đi tự động).
                  </td>
                  <td className="border border-[#d6d3cd] px-3 py-2">
                    Bắt buộc cấp Số ký hiệu văn bản kết quả và Trích yếu nội dung khi ký duyệt.
                  </td>
                </tr>
                <tr>
                  <td className="border border-[#d6d3cd] px-3 py-2 font-bold text-[#1e3a5f]">Quản trị &amp; Văn thư</td>
                  <td className="border border-[#d6d3cd] px-3 py-2 font-mono">quantri</td>
                  <td className="border border-[#d6d3cd] px-3 py-2">
                    Công bố/hiệu chỉnh/tạm ngưng Danh mục TTHC, Vào sổ Văn bản đến/đi (kèm độ mật NĐ 30/2020), thêm/xóa động Lịch nghỉ lễ SLA, xuất Sổ đăng ký CSV (Excel), tra cứu Nhật ký Kiểm toán (Audit Log kèm IP).
                  </td>
                  <td className="border border-[#d6d3cd] px-3 py-2">
                    Mọi thao tác can thiệp đều bị ghi nhận bất biến vào bảng AuditLog kèm dấu thời gian và địa chỉ IP; khóa tài khoản (<code>isActive=false</code>) thu hồi phiên tức thời.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#4b5563]">
            * Mật khẩu kiểm thử thống nhất cho toàn bộ tài khoản mẫu:{" "}
            <code className="bg-[#fef3c7] text-[#78350f] px-1.5 py-0.5 font-bold">HanhChinh@2026</code>
          </p>
        </section>

        {/* Phần 2: Quy tắc nghiệp vụ cốt lõi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-[#d6d3cd] p-6 rounded-[2px] space-y-3">
            <h2 className="text-base font-bold uppercase text-[#991b1b] flex items-center gap-2 font-official-serif">
              <Clock className="w-5 h-5" />
              2. Quy tắc Tính Thời hạn SLA &amp; Tạm dừng / Gia hạn
            </h2>
            <ul className="space-y-2 text-xs text-[#1f2937] leading-relaxed">
              <li>
                - <strong>Hai ca hành chính chuẩn (480 phút/ngày):</strong> Sáng <code>07:30 – 11:30</code> và Chiều <code>13:00 – 17:00</code> (Thứ Hai đến Thứ Sáu), loại trừ Thứ Bảy, Chủ Nhật và toàn bộ ngày lễ trong bảng <code>Holiday</code>.
              </li>
              <li>
                - <strong>Thủ tục giải quyết trong ngày (0 ngày - ví dụ Chứng thực bản sao):</strong> Tiếp nhận trước 15:00 hẹn trả 17:00 cùng ngày làm việc; tiếp nhận từ 15:00 trở đi tự động chuyển sang 11:30 ngày làm việc kế tiếp.
              </li>
              <li>
                - <strong>Yêu cầu bổ sung tối đa 01 lần (Mẫu 02 - NĐ 61/2018):</strong> Kiểm soát chặt <code>supplementCount &lt; 1</code> và hạn bổ sung 15 ngày làm việc (<code>supplementDeadline</code>). Khi nộp bổ sung, hệ thống tính đúng số phút làm việc hành chính đã tạm dừng (<code>calculateWorkingMinutesBetween</code>) để cộng bù vào <code>dueAt</code>.
              </li>
              <li>
                - <strong>Gia hạn tối đa 01 lần kèm Phiếu xin lỗi (Mẫu 04):</strong> Hệ thống kiểm tra <code>extendedCount &lt; 1</code>. Nếu đã gia hạn 1 lần, hệ thống khóa vĩnh viễn thao tác xin gia hạn lần 2 theo đúng Nghị định 61/2018/NĐ-CP.
              </li>
            </ul>
          </section>

          <section className="bg-white border border-[#d6d3cd] p-6 rounded-[2px] space-y-3">
            <h2 className="text-base font-bold uppercase text-[#991b1b] flex items-center gap-2 font-official-serif">
              <ShieldCheck className="w-5 h-5" />
              3. Chốt chặn Tài chính, Số hóa NĐ 45 &amp; 5 Trụ cột QĐ 766
            </h2>
            <ul className="space-y-2 text-xs text-[#1f2937] leading-relaxed">
              <li>
                - <strong>Chặn trả kết quả khi chưa thu phí &amp; Nhân phí bản sao:</strong> Mọi hồ sơ có phí bắt buộc có trạng thái <code>DA_THU_PHI</code> (đã cấp Biên lai <code>BL-2026-XXXX</code> nguyên tử qua bảng <code>SequenceCounter</code>) mới được chuyển sang <code>HOAN_THANH</code>; hỗ trợ tính phí theo số bản (<code>feePerCopy</code>).
              </li>
              <li>
                - <strong>Kho dữ liệu điện tử cá nhân (NĐ 45/2020):</strong> Kết quả giải quyết được cấp mã số hóa <code>KQĐT-UBND-...</code> và giấy tờ đã đối chiếu hợp lệ được lưu vào Kho cá nhân để tái sử dụng 1 chạm khi nộp hồ sơ mới.
              </li>
              <li>
                - <strong>Hệ thống 06 Biểu mẫu in A4 trực tiếp (Portal CSS):</strong> Mẫu số 01, Mẫu số 02, Mẫu số 03, Mẫu số 04, Mẫu số 05 và Biên lai thu lệ phí CTT50 (đọc số tiền bằng chữ tiếng Việt không giới hạn).
              </li>
              <li>
                - <strong>Bộ chỉ số Quyết định 766/QĐ-TTg đủ 05 trụ cột:</strong> Công khai minh bạch (18%), Tiến độ giải quyết (20%), Dịch vụ trực tuyến &amp; Thanh toán trực tuyến (22%), Số hóa hồ sơ &amp; kết quả (22%) và Mức độ hài lòng SIPAS (18%).
              </li>
            </ul>
          </section>
        </div>

        {/* Phần 3: Kịch bản thao tác thực hành nhanh */}
        <section className="bg-white border border-[#d6d3cd] p-6 rounded-[2px] space-y-3">
          <h2 className="text-base font-bold uppercase text-[#1e3a5f] flex items-center gap-2 font-official-serif">
            <CheckSquare className="w-5 h-5 text-[#15803d]" />
            4. Kịch bản Thực hành Luồng Nghiệp vụ Khép kín (Từ Nộp hồ sơ đến Khảo sát SIPAS)
          </h2>
          <ol className="space-y-2 text-xs text-[#1f2937] leading-relaxed list-decimal pl-5">
            <li>
              <strong>Bước 1 (Công dân):</strong> Vào mục <Link href="/nop-ho-so" className="text-[#991b1b] font-semibold underline">Nộp hồ sơ trực tuyến</Link>, chọn thủ tục <em>Cấp Giấy xác nhận tình trạng hôn nhân</em> (lệ phí 20.000đ), điền thông tin và nhận Mã biên nhận + Mã PIN 6 số.
            </li>
            <li>
              <strong>Bước 2 (Một cửa - <code>motcua</code>):</strong> Đăng nhập vào Bàn làm việc, mở hồ sơ trạng thái <code>Mới nộp</code>, kiểm tra thành phần và bấm <strong>Tiếp nhận &amp; Cấp giấy hẹn (Mẫu 01)</strong>. In Mẫu 01 kiểm tra hạn trả đã tự động trừ T7/CN.
            </li>
            <li>
              <strong>Bước 3 (Chuyên viên - <code>chuyenvien.tuphap</code>):</strong> Mở hồ sơ vừa tiếp nhận, bấm <strong>Thụ lý &amp; Thẩm định</strong>, tích xác nhận tính hợp lệ của các giấy tờ bắt buộc, nhập ý kiến thẩm định và bấm <strong>Trình Lãnh đạo ký</strong>.
            </li>
            <li>
              <strong>Bước 4 (Lãnh đạo - <code>lanhdao</code>):</strong> Vào mục <em>Chờ phê duyệt</em>, nhập Số hiệu kết quả (VD: <code>399/GXN-UBND</code>) và bấm <strong>Ký duyệt &amp; Ban hành kết quả</strong>. Kiểm tra mục <em>Quản lý Văn bản</em> sẽ thấy văn bản <code>399/GXN-UBND</code> đã tự động vào Sổ văn bản đi!
            </li>
            <li>
              <strong>Bước 5 (Một cửa - <code>motcua</code>):</strong> Thử bấm <em>Trả kết quả</em> ngay sẽ thấy hệ thống chặn cứng do chưa thu phí 20.000đ. Thực hiện bấm <strong>Thu lệ phí &amp; Xuất biên lai</strong> trước, sau đó bấm <strong>Trả kết quả</strong> để hoàn tất hồ sơ.
            </li>
            <li>
              <strong>Bước 6 (Công dân):</strong> Vào trang <Link href="/tra-cuu" className="text-[#991b1b] font-semibold underline">Tra cứu hồ sơ</Link>, nhập Mã hồ sơ + Mã PIN để in Biên lai điện tử và gửi phiếu <strong>Đánh giá hài lòng SIPAS</strong>.
            </li>
          </ol>

          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              href="/dang-nhap"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#991b1b] text-white rounded-[2px]"
            >
              <BookOpen className="w-4 h-4" />
              Mở trang Đăng nhập 5 Vai trò để thực hành
            </Link>
            <Link
              href="/tra-cuu?code=HS-20261106-0006&pin=528173"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-[#1e3a5f] text-[#1e3a5f] rounded-[2px]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xem thử Hồ sơ HS-20261106-0006 (Chờ thu phí trả kết quả)
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
