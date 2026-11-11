# NHẬT KÝ THỰC THI & KIỂM ĐỊNH HỆ THỐNG (WORK LOG)
**Dự án:** Hệ thống Thông tin Quản lý Hành chính & Một cửa Điện tử (HTTTHC)  
**Thư mục làm việc:** `c:\Users\bread\OneDrive\Máy tính\HTTTHC`  
**Cổng triển khai thực tế:** Web Production `http://localhost:3000` • PostgreSQL Docker `localhost:54322` (`httthc-db`)

---

## [Giai đoạn 0] Khảo sát Môi trường & Lập Kế hoạch Tổng thể
- **Thời gian bắt đầu:** `2026-11-11 06:38 (+07:00)`
- **Khảo sát công cụ có sẵn trên máy:**
  - `Node.js`: `v24.14.1` | `npm`: `11.12.1` | `Python`: `3.14.4`
  - `Docker`: `v29.8.2` đang mở sẵn; tận dụng trực tiếp image `postgres:15-alpine` (`fe0737ba566a`) có sẵn trong máy.
  - Cổng mạng: Cấp cổng `54322` cho container `httthc-db` để tách biệt hoàn toàn với container cũ trên máy; sử dụng cổng `3000` cho ứng dụng Web Production.
- **Khởi tạo Kế hoạch (`he-thong-quan-ly-hanh-chinh.md`):**
  - Thiết kế kiến trúc Full-stack Next.js App Router + Prisma PostgreSQL + JWT RBAC/ABAC.
  - Áp dụng nhận diện thị giác Cổng Hành chính công Việt Nam (Đỏ Quốc kỳ `#991B1B`, Vàng đồng `#D97706`, Nền giấy công vụ `#F7F5F0`, Xanh điều hành `#1E3A5F`, Quốc huy cách điệu Trống đồng Đông Sơn SVG tự dựng), tuân thủ tuyệt đối nguyên tắc không đụng chạm bất kỳ đường dẫn cổng công quyền nhà nước thực tế nào (sử dụng tên miền nội bộ mô phỏng `httthc.noibo.vn`).

---

## [Giai đoạn 1] Xây dựng Hạ tầng, Cơ sở dữ liệu & Bản Triển khai v1.0
- **Cơ sở dữ liệu & Seed chuẩn nghiệp vụ (`prisma/schema.prisma`, `prisma/seed.ts`):**
  - Khởi chạy container `httthc-db` (`postgres:15-alpine`, trạng thái `healthy`).
  - Thiết kế 08 bảng thực thể quan hệ chặt chẽ: `Department`, `User`, `Holiday`, `Procedure`, `Dossier`, `DossierAttachment`, `DossierHistory`, `OfficialDocument`, `AuditLog`.
  - Khởi tạo dữ liệu mẫu thực tế: 05 Bộ phận chuyên môn, 09 tài khoản thuộc 05 vai trò (`CONG_DAN`, `MOT_CUA`, `CHUYEN_VIEN`, `LANH_DAO`, `QUAN_TRI`), 11 mốc nghỉ lễ năm 2026, 08 Thủ tục hành chính thuộc 04 lĩnh vực, 10 hồ sơ trải đủ các trạng thái nghiệp vụ và Sổ Văn bản đến/đi.
- **Lõi Nghiệp vụ Backend & Hệ thống Giao diện v1.0:**
  - Xây dựng động cơ tính hạn SLA (`src/lib/sla-engine.ts`) tự động loại trừ Thứ Bảy, Chủ Nhật và ngày lễ; máy trạng thái Một cửa 09 trạng thái (`src/lib/workflow-engine.ts`) và bộ kiểm tra dữ liệu đầu vào Zod (`src/lib/validations.ts`).
  - Hoàn thiện 06 trang Cổng công khai (`/`, `/thu-tuc`, `/nop-ho-so`, `/tra-cuu`, `/ho-so-cua-toi`, `/so-tay-nghiep-vu`), trang `/dang-nhap`, 06 trang Bàn làm việc nội bộ (`/he-thong`, `/he-thong/ho-so`, `/he-thong/ho-so/[id]`, `/he-thong/van-ban`, `/he-thong/thu-tuc`, `/he-thong/quan-tri`) và hệ thống in biểu mẫu khổ A4 (`src/components/OfficialFormsPrint.tsx`).
  - Biên dịch thành công bản v1.0 và khởi chạy máy chủ tại `http://localhost:3000`.

---

## [Vòng 1] Quét Tổng Quan Toàn Hệ Thống & Giải Quyết Lần 1 (General Scan & Fix Round 1)
### 1. Kết quả Quét Tổng quan (Kết hợp MCP Playwright E2E + Subagent Kiểm toán Độc lập)
1. **`[CRITICAL-01]` Lệch tên thuộc tính `code` vs `action` trên danh sách nút thao tác hồ sơ (`src/app/he-thong/ho-so/[id]/page.tsx`)**:
   - `WorkflowRuleDefinition` trả về trường `code`, nhưng giao diện chi tiết hồ sơ đọc `act.action`, khiến nút đầu tiên luôn được tự động chọn nhưng khi bấm sang nút thứ 2 hoặc kiểm tra điều kiện ẩn/hiện trường nhập liệu phụ lại không khớp; đồng thời hàm `getAvailableActions()` vẫn hiển thị nút `TRA_KET_QUA` dù hồ sơ chưa thu lệ phí.
2. **`[HIGH-02]` Lệch tên trường khảo sát SIPAS & nhãn kênh Bưu chính công ích**:
   - Màn hình chi tiết hồ sơ nội bộ đọc nhầm `ratingScore`/`ratingComment` thay vì `satisfactionRating`/`satisfactionComment` trong Prisma schema; nhãn kênh nộp hồ sơ chưa phân biệt rõ `BUU_CHINH` với `TRUC_TIEP`.
3. **`[MEDIUM-03]` Cảnh báo Edge Runtime `jose` & cảnh báo `output: standalone` khi chạy `next start`, lỗi `404 /favicon.ico` trên Console**:
   - Gói `jose` nạp nhánh nén dùng `CompressionStream` gây cảnh báo khi đóng gói Middleware Edge; cấu hình cứng `output: "standalone"` sinh cảnh báo khi chạy `next start`; thiếu biểu tượng trang và trang `404` tiếng Việt đồng bộ; trang `/he-thong` hiển thị cả hồ sơ `DA_RUT_HO_SO` trong hàng đợi ưu tiên; trang `/he-thong/quan-tri` đọc nhầm trường `leadName` thay vì `headTitle`.

### 2. Giải pháp Khắc phục & Kiểm chứng Vòng 1
- Đồng bộ toàn bộ `act.code` tại `src/app/he-thong/ho-so/[id]/page.tsx` và lọc bỏ `TRA_KET_QUA` ngay trong `getAvailableActions()` (`src/lib/workflow-engine.ts`) khi hồ sơ có phí mà `feeStatus !== "DA_THU_PHI"`.
- Sửa hiển thị đánh giá SIPAS (`satisfactionRating`, `satisfactionComment`), nhãn `Dịch vụ Bưu chính công ích`, trường `headTitle` tại `/he-thong/quan-tri` và loại bỏ `DA_RUT_HO_SO` khỏi hàng đợi ưu tiên `/he-thong`.
- Tách mô-đun `src/lib/jwt-edge.ts` nhập trực tiếp `jose/jwt/sign` và `jose/jwt/verify`, đồng thời xác thực thật chữ ký JWT cho cả `/ho-so-cua-toi` trong `src/middleware.ts` -> triệt tiêu hoàn toàn cảnh báo Edge Runtime.
- Chuyển `output: "standalone"` sang kích hoạt theo biến môi trường `NEXT_OUTPUT_STANDALONE=1` trong `next.config.ts` & `Dockerfile`; bổ sung `src/app/icon.svg` và `src/app/not-found.tsx`.
- **Kiểm chứng trên MCP Playwright:** Biên dịch sạch `0` lỗi, `0` cảnh báo; đăng nhập `motcua` mở hồ sơ `HS-20261106-0006` xác nhận nút `Trả kết quả` bị ẩn khi chưa thu phí -> bấm `Thu lệ phí` sinh biên lai `BL-2026-0048` -> nút `Trả kết quả` lập tức mở khóa tự động; Console trình duyệt đạt `0` lỗi, `0` cảnh báo.

---

## [Vòng 2] Quét Chuyên Sâu Bảo Mật RBAC/ABAC & Nghiệp Vụ Biên + Giải Quyết Lần 2
### 1. Kết quả Quét Vòng 2
1. **Cách ly dữ liệu theo Phòng ban (ABAC) cho vai trò `CHUYEN_VIEN`**:
   - Mặc dù API thực thi workflow đã chặn chuyên viên xử lý chéo phòng ban, API liệt kê (`GET /api/dossiers?scope=all`) và API xem chi tiết (`GET /api/dossiers/[id]`) vẫn cho phép `CHUYEN_VIEN` xem hồ sơ phòng khác; API `PATCH /api/documents/[id]` chưa chặn chuyên viên lưu trữ tắt văn bản đến đang ở trạng thái `CHO_BUT_PHE`; API `/api/admin/metadata` trả danh sách `auditLogs` cho mọi cán bộ thay vì giới hạn ở `QUAN_TRI` và `LANH_DAO`.
2. **Tác nghiệp trực tuyến của Công dân không tài khoản qua Mã PIN 6 số**:
   - Công dân nộp hồ sơ trực tuyến không cần đăng nhập nhận được Mã biên nhận + Mã PIN 6 số, nhưng trang `/tra-cuu` mới chỉ cho phép xem biểu mẫu và chấm điểm SIPAS, chưa hỗ trợ nộp bổ sung tài liệu (Mẫu 02), thanh toán lệ phí trực tuyến hoặc rút hồ sơ bằng Mã PIN.
3. **Độ chính xác giờ hành chính khi cộng bù thời gian tạm dừng SLA (`compensatePausedDuration`) & Quản trị động Lịch nghỉ lễ**:
   - Phép cộng bù phút tạm dừng trực tiếp theo mili-giây thực tế có thể đẩy giờ hẹn trả rơi vào buổi tối ngoài khung `08:00 – 17:00`; hồ sơ đã có chuyên viên thẩm định khi nộp bổ sung bị lùi về `DA_TIEP_NHAN` thay vì khôi phục thẳng về `DANG_THAM_DINH`; danh mục `Holiday` chưa có giao diện thêm/xóa trực tiếp cho Quản trị viên; tham số `?redirect=` tại `/dang-nhap` cần khóa chặt chống Open Redirect và bổ sung OWASP HTTP Security Headers.

### 2. Giải pháp Khắc phục & Kiểm chứng Vòng 2
- Khóa chặt ABAC trên `GET /api/dossiers`, `GET /api/dossiers/[id]`, `PATCH /api/documents/[id]` và giao diện `/he-thong/ho-so`; giới hạn truy xuất `auditLogs` cho `QUAN_TRI` và `LANH_DAO`.
- Xây dựng `PATCH /api/public/track` xác thực Mã PIN 6 số và tích hợp cụm thao tác trực tuyến (Thanh toán lệ phí, Gửi tài liệu bổ sung Mẫu 02, Rút hồ sơ) ngay trên `/tra-cuu`.
- Viết lại thuật toán `compensatePausedDuration` trong `src/lib/sla-engine.ts` phân bổ số phút bù nằm gọn trong khung giờ làm việc `08:00 – 17:00` của các ngày làm việc hợp lệ, đồng thời khôi phục thông minh về `DANG_THAM_DINH` khi hồ sơ đã có chuyên viên thụ lý.
- Bổ sung `POST` / `DELETE /api/admin/metadata` và biểu mẫu thêm/xóa Ngày nghỉ lễ SLA trên `/he-thong/quan-tri`; chặn Open Redirect tại `/dang-nhap` và cấu hình đầy đủ HTTP Security Headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) trong `next.config.ts`.
- **Kiểm chứng trên MCP Playwright:** Truy cập `/tra-cuu?code=HS-20261109-0004&pin=845129`, thực hiện nộp tệp `BoSung_HoSo_TrucTuyen.pdf` -> hồ sơ chuyển ngay từ `YEU_CAU_BO_SUNG` sang `DANG_THAM_DINH`, hạn trả mới được tính chuẩn xác lúc `12:33:00 17/11/2026` (nằm trọn trong giờ hành chính ngày làm việc).

---

## [Vòng 3] Quét Giao Diện Hành Chính, Biểu Mẫu Khổ A4, Xuất Sổ CSV & Mobile Responsive + Giải Quyết Lần 3
### 1. Kết quả Quét Vòng 3
1. **Thiếu Biểu mẫu Mẫu số 05 (Phiếu kiểm soát quá trình giải quyết hồ sơ) & trùng ký hiệu số phiếu**:
   - Theo Thông tư 01/2018/TT-VPCP, ngoài Mẫu 01–04 cần có **Mẫu số 05 (Phiếu kiểm soát quá trình giải quyết hồ sơ)** in đầy đủ bảng lưu vết bàn giao giữa các bước; đồng thời khi hồ sơ đã từng gia hạn (`apologyFormCode` tồn tại), hàm hiển thị ký hiệu biểu mẫu dùng chung `apologyFormCode` cho cả Mẫu 01/02 thay vì tách ký hiệu riêng cho từng loại phiếu.
2. **Nhu cầu kết xuất Sổ đăng ký Hồ sơ Một cửa & Sổ Văn bản ra bảng tính Excel**:
   - Cán bộ Một cửa và Văn thư cần xuất danh sách đang lọc tại `/he-thong/ho-so` và `/he-thong/van-ban` ra tệp `.csv` hiển thị đúng tiếng Việt trên Microsoft Excel và an toàn trước lỗ hổng CSV Formula Injection.
3. **Trải nghiệm thiết bị di động (`390x844`) & Khả năng truy cập bàn phím (Accessibility)**:
   - Hộp thoại xem/in biểu mẫu A4 cần hỗ trợ cuộn ngang mượt trên màn hình điện thoại nhỏ, thuộc tính `role="dialog" aria-modal="true"` và đóng nhanh bằng phím `Escape`.

### 2. Giải pháp Khắc phục & Kiểm chứng Vòng 3
- Bổ sung **Mẫu số 05 (`MAU_05`)** vào `src/components/OfficialFormsPrint.tsx` kèm hàm `resolveFormSymbol` cấp số ký hiệu độc lập cho từng biểu mẫu (`GTN`, `PYCBS`, `PTCTN`, `PXL`, `PKS`), hỗ trợ phím `Escape` và bố cục cuộn ngang an toàn trên màn hình di động; gắn nút in Mẫu 05 tại `/he-thong/ho-so/[id]` và `/tra-cuu`.
- Tạo mô-đun `src/lib/csv-export.ts` gắn BOM UTF-8 (`\uFEFF`) và lọc ký tự công thức nguy hiểm (`=`, `+`, `-`, `@`, `\t`, `\r`); tích hợp nút **Xuất Sổ CSV (Excel)** tại `/he-thong/ho-so` và `/he-thong/van-ban`.
- **Kiểm chứng trên MCP Playwright:** Mở trực tiếp **Mẫu số 05** trên hồ sơ `HS-20261109-0004`, kiểm tra bảng 04 bước luân chuyển và chữ ký điện tử hiển thị sắc nét; kiểm tra nút **Xuất Sổ CSV (Excel)** trên cả `/he-thong/ho-so` và `/he-thong/van-ban` với `0` lỗi Console.

---

## [Vòng 4] Quét Tổng Thể Lần Cuối: Đối Soát Toán Học QĐ 766, Lưu Vết IP Kiểm Toán, Toàn Vẹn Dữ Liệu & Đồng Bộ Sổ Tay + Giải Quyết Lần 4
### 1. Kết quả Quét Vòng 4
1. **Đối soát toán học 100% chỉ tiêu thống kê trên `/he-thong`, `/` và `/api/analytics`**:
   - Tại `/he-thong/page.tsx`, truy vấn `officialDocument.findMany` đặt `take: 6` khiến thẻ KPI tổng số văn bản và số văn bản chờ bút phê bị giới hạn tối đa ở con số 6 nếu tổng văn bản vượt quá 6; thẻ KPI tổng hồ sơ chưa hiển thị rõ số hồ sơ đóng/rút (`TU_CHOI_TIEP_NHAN` / `DA_RUT_HO_SO`) để khớp tổng `Đang xử lý + Hoàn thành + Đóng/Rút = Tổng hồ sơ`.
   - Tại `/api/analytics/route.ts`, đối tượng `summary` chưa trả riêng trường `rejectedOrWithdrawnCount`; hàm `evaluateDossierSla` cần kiểm tra thêm trường hợp hồ sơ chuyển sang `YEU_CAU_BO_SUNG` sau khi đã trễ hạn (`slaPausedAt > dueAt`).
2. **Truy vết địa chỉ IP trong `AuditLog` & Giới hạn kích thước mảng đầu vào Zod**:
   - Bảng `AuditLog` đã có cột `ipAddress` nhưng các tuyến API ghi nhật ký chưa truyền địa chỉ IP thực tế từ HTTP Header (`x-forwarded-for` / `x-real-ip`); một số mảng trong schema Zod (`attachments`, `verifiedAttachmentIds`, `requiredDocs`) cần đặt ngưỡng `.max(25)` / `.max(30)` để phòng chống tấn công gửi mảng khổng lồ gây cạn kiệt bộ nhớ.
3. **Toàn vẹn tham chiếu Sổ Văn bản đi trong `prisma/seed.ts` & Đồng bộ tuyệt đối Sổ tay Nghiệp vụ**:
   - Hai hồ sơ mẫu đã ký duyệt trong `prisma/seed.ts` (`HS-20261106-0006` mang số hiệu `312/GXN-UBND` và `HS-20261102-0008` mang số hiệu `405/QĐ-UBND`) chưa có bản ghi tương ứng trong `OfficialDocument`; hồ sơ bị từ chối `HS-20261107-0010` có `feeAmount: 50000` nhưng đặt `feeStatus: "MIEN_PHI"` thay vì `"CHUA_THU_PHI"`.
   - Bảng nhân sự mẫu trong `SO_TAY_NGHIEP_VU.md` cần cập nhật khớp 100% họ tên và mã phòng ban (`BP-MC`) trong `prisma/seed.ts`, đồng thời bổ sung hướng dẫn cho Mẫu số 05, Xuất Sổ CSV, tác nghiệp Mã PIN và cấu hình động Lịch nghỉ lễ SLA.

### 2. Giải pháp Khắc phục & Kiểm chứng Vòng 4
- Gỡ giới hạn `take: 6` ở truy vấn thống kê văn bản trên `src/app/he-thong/page.tsx`, bổ sung hiển thị `closedDossiers` trên thẻ KPI điều hành, bổ sung `rejectedOrWithdrawnCount` trong `src/app/api/analytics/route.ts`, làm rõ tử số/mẫu số tỷ lệ đúng hạn trên `src/app/page.tsx`, và nâng cấp `evaluateDossierSla` (`src/lib/sla-engine.ts`) kiểm tra `slaPausedAt > dueAt`.
- Xây dựng hàm `getClientIp(req)` trong `src/lib/auth.ts` và gắn lưu vết `ipAddress` vào toàn bộ 08 tuyến API phát sinh biến động dữ liệu; bổ sung giới hạn `.max(...)` chặt chẽ cho toàn bộ mảng đầu vào Zod (`src/lib/validations.ts`, `src/app/api/procedures/route.ts`).
- Bổ sung 02 văn bản đi liên thông (`312/GXN-UBND`, `405/QĐ-UBND`) và chuẩn hóa `feeStatus: "CHUA_THU_PHI"` cho `HS-20261107-0010` trong `prisma/seed.ts`, nạp lại CSDL sạch và kiểm thử luồng ký duyệt thực tế của Lãnh đạo trên MCP Playwright.
- Đồng bộ 100% `SO_TAY_NGHIEP_VU.md`, `src/app/so-tay-nghiep-vu/page.tsx` và `he-thong-quan-ly-hanh-chinh.md`; quét tự động toàn bộ kho mã xác nhận `0` chuỗi tên miền cấm và `0` mã màu cấm.


---

## [Vòng Chuyên Sâu 1/3 — Tổng thể Vòng 5] Quét Sâu Pháp Lý NĐ 61/2018 (Giới Hạn Bổ Sung, SLA Phút Làm Việc, Tiếp Nhận 1 Bước, Lệ Phí Bản Sao) & Kiến Trúc Portal In Khổ A4
### 1. Phát hiện từ Quét Chuyên sâu Độc lập (Nghiệp vụ + UI/CSS)
1. **Nghiệp vụ pháp lý Một cửa (Nghị định 61/2018/NĐ-CP & Thông tư 01/2018/TT-VPCP)**:
   - Hệ thống chưa giới hạn số lần **Yêu cầu bổ sung hồ sơ (Mẫu 02)** tối đa `01` lần theo Khoản 3 Điều 15 Nghị định 61/2018/NĐ-CP và chưa cảnh báo riêng trạng thái quá hạn bổ sung (`supplementDeadline` 15 ngày làm việc).
   - Khi công dân nộp bổ sung qua đêm hoặc qua cuối tuần, phép trừ thời gian thực (`now - slaPausedAt`) cộng nhầm cả giờ ban đêm và Thứ Bảy/Chủ Nhật vào `totalPausedMinutes` thay vì chỉ tính số phút hành chính bị tạm dừng (`calculateWorkingMinutesBetween`).
   - Hồ sơ nộp trực tiếp tại quầy Một cửa cần tùy chọn **Tiếp nhận chính thức ngay trong 01 bước (`autoAccept`)**, tự động phân công chuyên viên ít việc nhất trong phòng ban (`pickLeastLoadedSpecialist`) và cấp Giấy hẹn Mẫu 01 tức thời; thiếu thao tác điều chuyển chuyên viên (`CHUYEN_CHUYEN_VIEN`) khi cán bộ nghỉ phép; thủ tục cấp bản sao trích lục (`1.000625`) cần nhân lệ phí theo `copiesCount` (`feePerCopy = true`).
2. **Giao diện, Hiệu năng React & In ấn biểu mẫu A4 (`@media print`)**:
   - CSS `@media print` ẩn anh em của `#__next` nhưng hộp thoại `OfficialFormsPrintModal` đặt sâu bên trong cây DOM kèm `max-h-[90vh] overflow-y-auto`, gây nguy cơ cắt trang hoặc còn vệt khung bao khi in biểu mẫu dài (Mẫu 05).
   - Hàm đọc số tiền bằng chữ `numberToVietnameseCurrency` chưa đọc tổng quát mọi mệnh giá lẻ; màn hình `/he-thong/ho-so/[id]` đặt `selectedAction` vào mảng phụ thuộc `useEffect` của `loadDetail`, gây gọi lại API mỗi khi gõ phím ghi chú.

### 2. Giải pháp Cải thiện & Kiểm chứng MCP Playwright (Vòng Chuyên sâu 1/3)
- Nâng cấp `prisma/schema.prisma` & `prisma/seed.ts`: bổ sung bảng `SequenceCounter`, `Procedure.feePerCopy`, `Dossier.supplementCount`, `Dossier.paymentMethod`, `Dossier.isDigitizedResult`, `Dossier.electronicResultCode`, `@unique` trên `Dossier.receiptNumber`, `DossierAttachment.reusedFromVault`, `OfficialDocument.outgoingNumber`.
- Cải tiến `src/lib/sla-engine.ts`, `src/lib/workflow-engine.ts`, `src/lib/specialist-assignment.ts`: chặn cứng `YEU_CAU_BO_SUNG` lần 2 (`HTTP 422`), đo đúng phút hành chính `calculateWorkingMinutesBetween`, cảnh báo `QUA_HAN_BO_SUNG`, hỗ trợ tiếp nhận 01 bước tại quầy, điều chuyển chuyên viên và nhân phí theo số bản sao.
- Chuyển `OfficialFormsPrintModal` sang `createPortal(..., document.body)` kết hợp luật CSS `@media print` cô lập tuyệt đối `#official-print-portal-root`; viết mới thuật toán đọc tiền tiếng Việt tổng quát 3 chữ số/nhóm; tách `useEffect` tại `src/app/he-thong/ho-so/[id]/page.tsx` triệt tiêu hoàn toàn lỗi gọi lại mạng khi gõ phím.
- **Kiểm chứng trực tiếp trên MCP Playwright:** Tiếp nhận 01 bước tại quầy tạo `HS-20261111-0011` tự động vào `DA_TIEP_NHAN` kèm chuyên viên thụ lý; nộp bổ sung `HS-20261109-0004` cộng bù đúng phút hành chính và chặn yêu cầu bổ sung lần 2 với mã `422`; chế độ `@media print` hiển thị trọn vẹn biểu mẫu A4 và gõ 12 ký tự liên tiếp chỉ phát sinh đúng `1` truy vấn mạng ban đầu.

---

## [Vòng Chuyên Sâu 2/3 — Tổng thể Vòng 6] Quét Sâu 5 Trụ Cột QĐ 766, Kho Dữ Liệu Số NĐ 45/2020, Văn Bản Mật NĐ 30/2020, Cấp Số Nguyên Tử & Tối Ưu Điều Hướng
### 1. Phát hiện từ Quét Chuyên sâu Lần 2
1. **Nghiệp vụ Chuyển đổi số (QĐ 766/QĐ-TTg, NĐ 45/2020/NĐ-CP, NĐ 30/2020/NĐ-CP) & Đồng bộ Ca làm việc**:
   - Giờ tiếp công dân niêm yết trên Header là `07:30 – 17:00` nhưng hằng số ca làm việc trong `sla-engine.ts` cần chuẩn hóa khớp tuyệt đối 02 ca hành chính Việt Nam: Sáng `07:30 – 11:30` (240 phút) + Chiều `13:00 – 17:00` (240 phút) = đúng `480` phút (`8 giờ/ngày`).
   - Việc sinh mã hồ sơ, số biên lai, mã phiếu xin lỗi, số đến/số đi bằng `count() + 1` có nguy cơ đụng độ khi nhiều giao dịch diễn ra đồng thời; cần chuyển toàn bộ sang cấp số nguyên tử bằng bảng `SequenceCounter`.
   - Công dân đã đăng nhập cần **Kho dữ liệu điện tử cá nhân (`GET /api/dossiers?vault=1`)** trên trang `/nop-ho-so` để đính kèm lại 1 chạm các giấy tờ đã đối chiếu hoặc kết quả điện tử trước đó (`reusedFromVault: true`).
   - Văn bản có độ mật `MAT` / `TOI_MAT` cần kiểm soát ABAC nghiêm ngặt (chỉ Lãnh đạo, Quản trị Văn thư, người tạo hoặc người được giao xử lý mới được xem/cập nhật); văn bản đi cần luồng **Trả lại dự thảo (`TRA_LAI_DU_THAO`)** và tự động cấp **Số đi (`outgoingNumber`)** khi ký ban hành; Danh mục TTHC cần API `PATCH /api/procedures` để hiệu chỉnh/tạm ngưng và ẩn TTHC tạm ngưng khỏi người dùng chưa xác thực; Bộ chỉ số QĐ 766 cần tính đủ cả **05 trụ cột chuẩn**.
2. **Giao diện & Điều hướng Nội bộ (`PublicHeader`, `StaffShell`, Modal Alerts)**:
   - Tiêu đề cơ quan trên `PublicHeader` dùng thẻ `<h1>` gây trùng lặp `<h1>` trên các trang con; `StaffShell` cần nút thu gọn/mở rộng thanh bên (`256px ↔ 64px`), thuộc tính `aria-current="page"`, khóa cuộn nền và đóng ngăn kéo di động bằng phím `Escape`; thông báo lỗi trong các hộp thoại tạo Văn bản / tạo TTHC cần đặt ngay bên trong hộp thoại (`role="alert"`) thay vì nằm khuất phía sau lớp phủ mờ.

### 2. Giải pháp Cải thiện & Kiểm chứng MCP Playwright (Vòng Chuyên sâu 2/3)
- Chuẩn hóa 02 ca làm việc `07:30–11:30` & `13:00–17:00` (`480 phút/ngày`) trong `src/lib/sla-engine.ts`; tạo `src/lib/sequence.ts` (`nextSequence` bằng `upsert` nguyên tử) tích hợp xuyên suốt 05 tuyến API sinh số hiệu.
- Triển khai Kho dữ liệu điện tử cá nhân (`?vault=1` và bảng chọn đính kèm 1 chạm trên `/nop-ho-so`); áp dụng ABAC độ mật `MAT`/`TOI_MAT`, thao tác `TRA_LAI_DU_THAO` và cấp `outgoingNumber` tự động trên `/he-thong/van-ban`; bổ sung `PATCH /api/procedures` và hộp thoại Hiệu chỉnh TTHC trên `/he-thong/thu-tuc`; nâng cấp `/api/analytics`, `/` và `/he-thong` hiển thị trọn vẹn **05 trụ cột QĐ 766/QĐ-TTg**.
- Nâng cấp `PublicHeader.tsx` và `StaffShell.tsx` (thu gọn thanh bên `w-64`/`w-16`, `aria-current="page"`, `Escape` mobile drawer, độ tương phản `#4b5563`).
- **Kiểm chứng trực tiếp trên MCP Playwright:** Xác nhận 05 trụ cột QĐ 766 (`overallScore = 77.2`); đăng nhập `motcua` xác nhận không thấy văn bản mật `95/BC-CATP-M` và gọi `PATCH` trả về `403`, trong khi `chuyenvien.tuphap` (người nhận giao việc) và `lanhdao` truy cập hợp lệ; kiểm thử luồng `CHO_KY_BAN_HANH → TRA_LAI_DU_THAO (DANG_XU_LY) → CAP_NHAT_XU_LY (CHO_KY_BAN_HANH) → KY_BAN_HANH (DA_BAN_HANH, outgoingNumber = 105)`; kiểm thử tạm ngưng/khôi phục TTHC (`?all=1` ẩn với khách vãng lai); kiểm thử thu gọn thanh bên `256px → 64px`; đăng nhập `congdan` bấm `Đính kèm [BC-GOC]` từ Kho dữ liệu số hiển thị huy hiệu `"Tái sử dụng Kho dữ liệu số"` và nộp thành công hồ sơ `HS-20261111-0011` (3 bản sao = `30.000 đồng`).

---

## [Vòng Chuyên Sâu 3/3 — Tổng thể Vòng 7] Gia Cố Thu Hồi Phiên Thời Gian Thực, PIN Mật Mã Học, Chống Ghi Đè SIPAS, Xác Nhận Trực Tuyến 2 Bước & Chuẩn Hóa WCAG AA
### 1. Phát hiện từ Quét Chuyên sâu Lần 3
1. **An toàn Xác thực, Mật mã học & Toàn vẹn Khảo sát**:
   - Hàm `getCurrentSession()` trong `src/lib/auth.ts` mới chỉ xác minh chữ ký JWT mà chưa đối chiếu trực tiếp cột `User.isActive` và vai trò hiện hành trong CSDL PostgreSQL — nếu quản trị viên khóa tài khoản cán bộ nghỉ việc (`isActive = false`), cookie JWT cũ vẫn còn hiệu lực cho đến khi hết hạn.
   - Mã PIN 6 chữ số trong `POST /api/dossiers` dùng `Math.random()` thay vì bộ sinh số ngẫu nhiên mật mã học `crypto.randomInt(100000, 1000000)`; tham số lọc `?status=` trong `GET /api/dossiers` cần kiểm tra hợp lệ theo tập `VALID_DOSSIER_STATUSES` để trả mã `400` gọn gàng thay vì đẩy chuỗi lạ xuống Prisma Enum.
   - Tuyến `POST /api/public/track` (chấm điểm SIPAS) dù đã ẩn biểu mẫu trên UI khi hồ sơ có điểm nhưng nếu gọi API trực tiếp vẫn có thể ghi đè đánh giá cũ — cần chặn cứng `HTTP 409 Conflict` khi `satisfactionRating !== null`.
2. **Chi tiết Trải nghiệm Người dùng (UX), Xác nhận 2 bước & Tiếp cận WCAG AA**:
   - Trang `/ho-so-cua-toi` và `/tra-cuu` trước đó dùng chung biến thông báo màu xanh cho cả trường hợp lỗi API, và dùng `window.confirm` hoặc bấm rút hồ sơ 1 chạm; nút xóa ngày nghỉ lễ trên `/he-thong/quan-tri` cũng xóa ngay khi bấm 1 chạm.
   - Các trang `/dang-nhap`, `/thu-tuc`, `/tra-cuu`, `/ho-so-cua-toi`, `/so-tay-nghiep-vu` cần đồng bộ duy nhất 01 thẻ `<h1>` chuẩn phân cấp ngữ nghĩa; ô đăng nhập cần `autoComplete="username"` & `"current-password"` để triệt tiêu cảnh báo DOM trên trình duyệt; các ô PIN/CCCD cần `inputMode="numeric"`; danh sách `/thu-tuc` và `/he-thong/ho-so` cần bộ đếm số lượng đang hiển thị kèm nút `"Xóa bộ lọc"`; các nhãn phụ `#6b7280` trên nền giấy ấm `#faf8f5` cần tăng độ đậm lên `#4b5563` để vượt ngưỡng tương phản WCAG AA (`> 7:1`).

### 2. Giải pháp Cải thiện & Kiểm chứng Cuối cùng (Vòng Chuyên sâu 3/3)
- Cập nhật `src/lib/auth.ts` truy vấn `prisma.user.findUnique` kiểm tra `isActive` và đồng bộ `role`/`departmentId` thời gian thực trong mọi yêu cầu xác thực; nâng cấp `crypto.randomInt(100000, 1000000)` và `VALID_DOSSIER_STATUSES` trong `src/app/api/dossiers/route.ts`; bổ sung chốt chặn `409 Conflict` chống ghi đè khảo sát SIPAS trong `src/app/api/public/track/route.ts`.
- Chuẩn hóa toàn bộ `src/app/dang-nhap/page.tsx`, `src/app/ho-so-cua-toi/page.tsx`, `src/app/tra-cuu/page.tsx`, `src/app/thu-tuc/page.tsx`, `src/app/he-thong/ho-so/page.tsx`, `src/app/he-thong/quan-tri/page.tsx`, `src/components/QuickLookupBox.tsx` và `src/app/so-tay-nghiep-vu/page.tsx`: tách riêng băng rôn lỗi đỏ (`role="alert"`) và thành công xanh (`role="status"`), thay toàn bộ thao tác hủy/rút/xóa sang **xác nhận trực tuyến 2 bước**, hiển thị mã `KQĐT` cho chủ hồ sơ, bổ sung bộ đếm & nút `"Xóa bộ lọc"`, `aria-expanded`, `autoComplete`, `inputMode="numeric"` và đồng bộ độ tương phản `#4b5563`.
- Thực hiện đối soát độc lập lần cuối bởi 02 Subagent chuyên trách Nghiệp vụ và Giao diện/In ấn, biên dịch sạch Production, nạp lại dữ liệu chuẩn ban đầu và kiểm thử toàn diện trên MCP Playwright ở cả Desktop (`1440x900`) và Mobile (`390x844`).

---

## [Đóng Gói Phát Hành v2.0 & Khởi Tạo Kho Git] Đồng Bộ Tài Liệu & Vệ Sinh Bảo Mật Kho Mã Nguồn
- Rà soát và đồng bộ 100% nội dung giữa tệp `SO_TAY_NGHIEP_VU.md` (bổ sung chi tiết phân quyền độ mật `MAT`/`TOI_MAT` NĐ 30/2020, luồng `TRA_LAI_DU_THAO`, cấp số nguyên tử `SequenceCounter`, quản trị `PATCH /api/procedures`, thu hồi phiên tức thời `isActive = false` và xác nhận trực tuyến 02 bước) với giao diện `/so-tay-nghiep-vu`.
- Bổ sung `.env.example` mẫu an toàn, gia cố `.gitignore` chặn tuyệt đối `.env`, `.env.*`, `.playwright-mcp/`, `*.log`, `*.tsbuildinfo`, cập nhật `package.json` lên `2.0.0` và biên soạn `README.md` chuẩn hướng dẫn khởi chạy nhanh cho kho Git.
- Khởi tạo kho Git cục bộ trên nhánh `main` (`git init -b main`) và đóng gói bản commit phát hành sạch không chứa khóa bí mật hay tệp sinh tự động.

---

## [Cập Nhật Giao Diện v2.1] Chuyển Đổi Tông Màu Vàng Kem – Đỏ Cờ – Hoa Sen & Đổi Đơn Vị Sang UBND Phường Thanh Nhàn
- Giữ nguyên cấu trúc bố cục giao diện đã ổn định, chuyển đổi đồng bộ toàn bộ bảng màu từ tông Xanh đậm (`#1E3A5F`) cũ sang hệ màu **Cổng Dịch vụ công Vàng kem Hoàng gia (`#FCE8A6` / `#FFF1BD`) + Thanh điều hướng Đỏ cờ tươi (`#D71920` / `#CE1126`) + Họa tiết Hoa sen & Trống đồng SVG (`LotusGardenStrip`) + Phân lớp nền Trắng sáng (`#FFFFFF`) & Xám sáng (`#F3F4F6`)**.
- Đổi đồng bộ 100% đơn vị hành chính sang **UBND Phường Thanh Nhàn** (Thành phố Hà Nội, mã vùng điện thoại `(024) 3971 0101`, địa chỉ phố Thanh Nhàn / Kim Ngưu / Võ Thị Sáu / Trần Khát Chân) trên toàn bộ Header, Footer, Bàn làm việc nội bộ, 06 Biểu mẫu in khổ A4, API Kho dữ liệu số, dữ liệu mẫu PostgreSQL (`prisma/seed.ts`) và tài liệu hướng dẫn.
