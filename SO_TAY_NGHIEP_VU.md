# SỔ TAY NGHIỆP VỤ & HƯỚNG DẪN SỬ DỤNG HỆ THỐNG (USER GUIDE)
## Hệ thống Thông tin Quản lý Hành chính & Một cửa Điện tử — UBND Phường Thanh Nhàn (`httthc.noibo.vn`)

> **Phiên bản tài liệu**: v2.0 (Đồng bộ sau 7 vòng kiểm định & chuẩn hóa chuyên sâu: 4 vòng tổng quan + 3 vòng chuyên sâu nghiệp vụ & UX) — Áp dụng cho Công chức Bộ phận Một cửa, Chuyên viên Phòng/Ban chuyên môn, Lãnh đạo UBND, Quản trị viên Văn thư và Công dân/Tổ chức.
> **Căn cứ nghiệp vụ mô phỏng**: Nghị định số 61/2018/NĐ-CP, Nghị định số 107/2021/NĐ-CP (Cơ chế Một cửa, một cửa liên thông), Nghị định số 45/2020/NĐ-CP (Thực hiện TTHC trên môi trường điện tử & Kho dữ liệu điện tử), Nghị định số 30/2020/NĐ-CP (Công tác văn thư & bảo mật văn bản), Thông tư số 01/2018/TT-VPCP, Quyết định số 766/QĐ-TTg (Bộ 05 chỉ số phục vụ người dân, doanh nghiệp).

---

## 1. Tổng quan Kiến trúc Nghiệp vụ Hệ thống

Hệ thống được thiết kế thành **02 phân hệ tách biệt về quyền truy cập nhưng liên thông dữ liệu thời gian thực**:

1. **Cổng Dịch vụ công & Tra cứu Công khai (`/`, `/thu-tuc`, `/nop-ho-so`, `/tra-cuu`, `/ho-so-cua-toi`, `/so-tay-nghiep-vu`)**:
   - Niêm yết minh bạch Danh mục Thủ tục hành chính (căn cứ pháp lý, trình tự, thành phần bắt buộc, định mức thời gian SLA, mức thu lệ phí, đối tượng miễn phí).
   - Tiếp nhận hồ sơ Dịch vụ công trực tuyến (kèm kiểm tra định dạng CCCD 12 số / MST 10-13 số, điện thoại Việt Nam 10 số, thông tin ủy quyền hợp pháp, đối tượng miễn lệ phí, tự động nhân lệ phí theo số bản sao với TTHC có `feePerCopy = true` và **tái sử dụng 1 chạm giấy tờ từ Kho dữ liệu điện tử cá nhân** theo Điều 11 Nghị định 45/2020/NĐ-CP).
   - Tra cứu tiến độ hồ sơ theo Mã số biên nhận (`HS-YYYYMMDD-XXXX`) với cơ chế **ẩn danh bảo vệ dữ liệu cá nhân mặc định**, và mở khóa toàn văn **06 Biểu mẫu hành chính khổ A4** + **tác nghiệp trực tuyến của chủ hồ sơ (nộp bổ sung Mẫu 02, nộp lệ phí trực tuyến, rút hồ sơ xác nhận 2 bước, đánh giá SIPAS chống ghi đè)** khi nhập đúng **Mã PIN bảo mật 6 chữ số** sinh bằng mật mã học (`crypto.randomInt`).
   - Bảng công khai thời gian thực kết quả thực hiện **Bộ 05 chỉ số Quyết định 766/QĐ-TTg** (Công khai minh bạch 18%, Tiến độ giải quyết 20%, Dịch vụ trực tuyến & Thanh toán trực tuyến 22%, Số hóa hồ sơ & kết quả 22%, Mức độ hài lòng SIPAS 18%) đối soát toán học 100% từ cơ sở dữ liệu PostgreSQL.

2. **Bàn làm việc Điện tử Nội bộ (`/he-thong/*` — Thanh điều hướng thu gọn linh hoạt `256px / 64px`)**:
   - **Tổng quan điều hành (`/he-thong`)**: Giám sát SLA toàn cơ quan (gồm cả cảnh báo quá hạn bổ sung Mẫu 02), cảnh báo hồ sơ quá hạn/sắp đến hạn, đối soát hồ sơ đang xử lý - hoàn thành - đóng/rút, ẩn văn bản Mật/Tối mật theo đúng thẩm quyền ABAC và thống kê tải theo từng bộ phận chuyên môn.
   - **Hồ sơ Một cửa (`/he-thong/ho-so` & `/he-thong/ho-so/[id]`)**: Tiếp nhận 01 bước tại quầy (`autoAccept`) tự động phân công chuyên viên ít việc nhất và cấp Giấy hẹn Mẫu 01 ngay, điều chuyển chuyên viên (`CHUYEN_CHUYEN_VIEN`), đối chiếu pháp lý giấy tờ, thẩm định, trình ký, ký ban hành kết quả điện tử (`KQĐT-UBND-...`), thu lệ phí nguyên tử (`SequenceCounter`), gia hạn kèm Phiếu xin lỗi, trả kết quả và **Xuất Sổ theo dõi hồ sơ CSV (Excel UTF-8 BOM)**.
   - **Văn bản & Điều hành (`/he-thong/van-ban`)**: Sổ đăng ký Văn bản đến (`incomingNumber` nguyên tử), Sổ Văn bản đi (`outgoingNumber` nguyên tử khi ký ban hành), phân quyền độ mật (`THUONG` / `MAT` / `TOI_MAT`), bút phê giao việc của Lãnh đạo, trả lại dự thảo chỉnh sửa (`TRA_LAI_DU_THAO`), tự động liên thông văn bản kết quả TTHC và **Xuất Sổ đăng ký văn bản CSV (Excel UTF-8 BOM)**.
   - **Danh mục TTHC (`/he-thong/thu-tuc`)**: Công bố mới, hiệu chỉnh trực tuyến thời hạn/lệ phí/cờ nhân phí bản sao và tạm ngưng/kích hoạt TTHC (`PATCH /api/procedures` ghi nhận `AuditLog`).
   - **Cơ cấu & Nhật ký Audit (`/he-thong/quan-tri`)**: Quản lý cơ cấu phòng ban, danh bạ công chức RBAC/ABAC (thu hồi phiên tức thời khi `isActive = false`), **thêm/xóa động Lịch nghỉ lễ loại trừ SLA (xác nhận 2 bước)** và tra cứu **Nhật ký kiểm toán bất biến (`AuditLog`) kèm địa chỉ IP**.

---

## 2. Danh mục Vai trò Phân quyền (RBAC & ABAC) và Tài khoản Thực hành

Mật khẩu dùng chung cho tất cả tài khoản thực hành trong môi trường triển khai nội bộ: **`HanhChinh@2026`**

| STT | Tài khoản | Họ và tên | Vai trò (`Role`) | Đơn vị (`ABAC`) | Phạm vi thẩm quyền chính |
|---|---|---|---|---|---|
| 1 | `motcua` | Lê Thị Thu Hà | `MOT_CUA` | Bộ phận Một cửa (`BP-MC`) | Tiếp nhận tại quầy/trực tuyến, cấp Mẫu 01, yêu cầu bổ sung (Mẫu 02), từ chối (Mẫu 03), thu lệ phí (Biên lai), trả kết quả |
| 2 | `chuyenvien.tuphap` | Phạm Hoàng Nam | `CHUYEN_VIEN` | Tư pháp - Hộ tịch (`TP-HT`) | Chỉ được xem, thẩm định, đối chiếu giấy tờ, yêu cầu bổ sung, gia hạn (Mẫu 04), trình ký hồ sơ thuộc **Bộ phận Tư pháp - Hộ tịch** |
| 3 | `chuyenvien.diachinh` | Vũ Đình Khôi | `CHUYEN_VIEN` | Địa chính - Xây dựng (`DC-XD`) | Chỉ truy cập và xử lý hồ sơ/văn bản thuộc thẩm quyền **Bộ phận Địa chính - Xây dựng - Đô thị & Môi trường** |
| 4 | `chuyenvien.vhxh` | Đặng Mai Phương | `CHUYEN_VIEN` | Văn hóa - Xã hội (`VH-XH`) | Chỉ truy cập và xử lý hồ sơ/văn bản thuộc thẩm quyền **Bộ phận Văn hóa - Xã hội & Lao động Thương binh** |
| 5 | `chuyenvien.kinhte` | Ngô Gia Huy | `CHUYEN_VIEN` | Kinh tế - Tài chính (`KT-TC`) | Chỉ truy cập và xử lý hồ sơ/văn bản thuộc thẩm quyền **Bộ phận Kinh tế - Tài chính - Kế hoạch** |
| 6 | `lanhdao` | Trần Quốc Bảo | `LANH_DAO` | Chủ tịch UBND Phường (`BP-MC`) | Ký duyệt ban hành kết quả TTHC (tự động vào Sổ Văn bản đi), trả lại thẩm định, bút phê văn bản đến, ký ban hành văn bản đi, giám sát Audit Log |
| 7 | `quantri` | Nguyễn Văn Minh | `QUAN_TRI` | Chánh Văn phòng (`BP-MC`) | Công bố mới TTHC, thêm/xóa Lịch nghỉ lễ SLA, quản trị văn thư và giám sát toàn diện Nhật ký Kiểm toán (`AuditLog`) |
| 8 | `congdan` | Hoàng Minh Tuấn | `CONG_DAN` | Công dân đã xác thực | Nộp hồ sơ trực tuyến, theo dõi hồ sơ cá nhân tại `/ho-so-cua-toi`, nộp bổ sung tài liệu, thanh toán lệ phí trực tuyến, rút hồ sơ |
| 9 | `congdan2` | Nguyễn Thị Bích Ngọc | `CONG_DAN` | Công dân đã xác thực | Tài khoản công dân thứ hai phục vụ kiểm thử cách ly quyền sở hữu hồ sơ cá nhân và chốt chặn thu lệ phí |

> **Quy tắc ABAC (Attribute-Based Access Control)**: Chuyên viên thuộc bộ phận nào chỉ được phép xem danh sách, xem chi tiết và thực thi nghiệp vụ trên hồ sơ/văn bản của đúng bộ phận đó. Nếu cố tình truy cập chéo qua API (`/api/dossiers`, `/api/dossiers/[id]`, `/api/dossiers/[id]/workflow`, `/api/documents/[id]`), máy chủ chặn cứng với mã `403 Forbidden`.

---

## 3. Quy trình Nghiệp vụ Một cửa Chuẩn hóa (State Machine 9 Trạng thái)

### 3.1. Sơ đồ Luân chuyển Trạng thái Hồ sơ
1. **`MOI_NOP` (Mới nộp trực tuyến / Đăng ký tại quầy)**:
   - Công dân gửi hồ sơ qua cổng `/nop-ho-so` hoặc cán bộ tạo hồ sơ tại quầy. Chưa tính SLA cho đến khi Cán bộ Một cửa kiểm tra đầy đủ thành phần hồ sơ.
   - Hành động hợp lệ: `TIEP_NHAN` (sang `DA_TIEP_NHAN`), `YEU_CAU_BO_SUNG` (sang `YEU_CAU_BO_SUNG`), `TU_CHOI_TIEP_NHAN` (sang `TU_CHOI_TIEP_NHAN`), hoặc Công dân chọn `RUT_HO_SO` (sang `DA_RUT_HO_SO`).
2. **`DA_TIEP_NHAN` (Đã tiếp nhận & Hẹn trả - Mẫu 01)**:
   - Cấp Giấy tiếp nhận & hẹn trả kết quả (Mẫu 01), kích hoạt đồng hồ SLA và phân công Chuyên viên phòng chuyên môn.
   - Hành động hợp lệ: Chuyên viên bấm `NHAN_THAM_DINH` (sang `DANG_THAM_DINH`), `YEU_CAU_BO_SUNG`, hoặc thu trước lệ phí (`THU_LE_PHI`).
3. **`DANG_THAM_DINH` (Đang thẩm định chuyên môn)**:
   - Chuyên viên kiểm tra thực chất pháp lý từng giấy tờ đính kèm (`isVerified = true`).
   - **Ràng buộc bắt buộc**: Phải tích đối chiếu hợp lệ **100% giấy tờ bắt buộc** và nhập **Ý kiến thẩm định chuyên môn** tối thiểu 10 ký tự mới được `TRINH_PHE_DUYET`.
   - Nếu cần xác minh thực địa/liên ngành phức tạp, được phép `GIA_HAN_XIN_LOI` **tối đa 01 lần duy nhất** kèm **Phiếu xin lỗi và hẹn lại ngày trả kết quả (Mẫu 04)**.
4. **`YEU_CAU_BO_SUNG` (Tạm dừng chờ bổ sung tối đa 01 lần - Mẫu 02)**:
   - Theo Khoản 3 Điều 15 Nghị định 61/2018/NĐ-CP, cơ quan giải quyết chỉ được yêu cầu bổ sung hồ sơ **tối đa 01 lần** (`supplementCount < 1`) kèm hạn bổ sung 15 ngày làm việc (`supplementDeadline`). Nếu quá hạn bổ sung, hệ thống cảnh báo `QUA_HAN_BO_SUNG`.
   - Khi Công dân (tại `/tra-cuu` bằng Mã PIN hoặc tại `/ho-so-cua-toi`) hay Cán bộ Một cửa thực hiện `BO_SUNG_HO_SO`, hệ thống tính chính xác số phút làm việc hành chính đã tạm dừng (`calculateWorkingMinutesBetween`) và **cộng bù vào hạn trả kết quả `dueAt` trong 02 ca hành chính `07:30 – 11:30` và `13:00 – 17:00` (480 phút/ngày)**, sau đó khôi phục sang `DANG_THAM_DINH` hoặc `DA_TIEP_NHAN`.
5. **`CHO_PHE_DUYET` (Chờ Lãnh đạo phê duyệt)**:
   - Lãnh đạo UBND xem báo cáo thẩm định và quyết định:
     - `PHE_DUYET_KET_QUA`: Nhập Số hiệu văn bản kết quả (ví dụ `399/GKS-UBND`) và Trích yếu -> Hệ thống chuyển hồ sơ sang `CHO_TRA_KET_QUA`, **cấp Mã kết quả điện tử số hóa (`KQĐT-UBND-2026-XXXX`)** vào Kho dữ liệu cá nhân, đồng thời **tự động ghi nhận vào Sổ Văn bản đi (`OfficialDocument`) kèm Số đi liên tiếp (`outgoingNumber`)**.
     - `TRA_LAI_THAM_DINH`: Ghi rõ ý kiến chỉ đạo -> Hồ sơ quay về `DANG_THAM_DINH`.
6. **`CHO_TRA_KET_QUA` (Đã có kết quả - Chờ trả công dân)**:
   - **Chốt chặn Tài chính bắt buộc**: Nếu hồ sơ có thu lệ phí (`feeAmount > 0` và `feeExempt = false`) mà trạng thái phí đang là `CHUA_THU_PHI`, hệ thống **ẩn và khóa cứng** hành động `TRA_KET_QUA`.
   - Sau khi Cán bộ Một cửa bấm `THU_LE_PHI` (hoặc công dân thanh toán trực tuyến bằng Mã PIN tại `/tra-cuu` / `/ho-so-cua-toi`), hệ thống cấp **Biên lai điện tử (`BL-2026-XXXX`)**, mở khóa nút `TRA_KET_QUA` để kết thúc hồ sơ sang `HOAN_THANH`.
7. **`HOAN_THANH` / `TU_CHOI_TIEP_NHAN` / `DA_RUT_HO_SO`**:
   - Các trạng thái kết thúc vòng đời hồ sơ. Nếu rút hồ sơ hoặc từ chối khi đã nộp phí, hệ thống tự động chuyển sang `HOAN_PHI`. Hồ sơ `HOAN_THANH` mở khảo sát hài lòng **SIPAS**.

---

## 4. Công thức Động cơ Tính Hạn SLA Hai Ca Hành Chính (`src/lib/sla-engine.ts`)

- **Hai ca làm việc tiêu chuẩn (480 phút/ngày = 8 giờ/ngày)**: Thứ Hai đến Thứ Sáu, Ca sáng `07:30 – 11:30` (240 phút) và Ca chiều `13:00 – 17:00` (240 phút), đồng bộ tuyệt đối với giờ tiếp công dân niêm yết trên Cổng thông tin.
- **Loại trừ tự động & Cấu hình động**: Tự động loại trừ giờ nghỉ trưa (`11:30 – 13:00`), Thứ Bảy, Chủ Nhật và toàn bộ ngày Lễ, Tết trong bảng `Holiday`. Quản trị viên (`quantri`) có thể thêm mới hoặc gỡ bỏ ngày nghỉ lễ hoán đổi đột xuất trực tiếp tại `/he-thong/quan-tri`.
- **Thủ tục giải quyết trong ngày (`processingDays = 0`, ví dụ Chứng thực bản sao 4–8 giờ)**:
  - Tiếp nhận trước `15:00` ngày làm việc -> Hẹn trả lúc `17:00` cùng ngày.
  - Tiếp nhận từ `15:00` trở đi hoặc ngày nghỉ -> Chuyển hạn trả sang `11:30` ngày làm việc kế tiếp.
- **Đo & Cộng bù chính xác phút làm việc (`calculateWorkingMinutesBetween` & `addWorkingMinutes`)**: Chỉ đếm số phút hành chính thực tế bị tạm dừng (không cộng nhầm đêm tối hay cuối tuần) và phân bổ chính xác số phút bù trong hai ca `07:30 – 11:30` và `13:00 – 17:00`.

---

## 5. Quy trình Quản lý Văn bản, Sổ Đăng ký CSV & Biểu mẫu A4

### 5.1. Điều hành Văn bản, Danh mục TTHC & Quản trị Bảo mật (`/he-thong/van-ban`, `/he-thong/thu-tuc`, `/he-thong/quan-tri`)
1. **Vào sổ Văn bản đến & Phân loại Độ mật**: Hệ thống cấp **Số đến liên tiếp nguyên tử (`incomingNumber` qua `SequenceCounter`)**, gắn cấp độ mật (`THUONG` / `MAT` / `TOI_MAT` theo Nghị định 30/2020/NĐ-CP) và đặt trạng thái `CHO_BUT_PHE`. Văn bản `MAT` / `TOI_MAT` bị ẩn hoàn toàn trên danh sách, chi tiết và thống kê Dashboard đối với tài khoản không thuộc diện được phân công xử lý.
2. **Lãnh đạo Bút phê Phân công**: Tài khoản `lanhdao` / `quantri` thực hiện `BUT_PHE_PHAN_CONG`, giao đơn vị chủ trì và chuyên viên -> `DANG_XU_LY`. Văn bản chưa có bút phê không thể bị lưu trữ tắt bởi chuyên viên.
3. **Báo cáo Hoàn thành & Lưu trữ**: Chuyên viên thuộc đúng đơn vị chủ trì nhập báo cáo kết quả (`CAP_NHAT_XU_LY`) -> `LUU_TRU`.
4. **Dự thảo, Trả lại & Ký ban hành Văn bản đi**: Chuyên viên tạo dự thảo (`CHO_KY_BAN_HANH`). Lãnh đạo có thể yêu cầu chỉnh sửa lại (`TRA_LAI_DU_THAO` -> `DU_THAO`) hoặc ký duyệt chính thức (`KY_BAN_HANH` -> `DA_BAN_HANH`, tự động cấp **Số đi liên tiếp nguyên tử `outgoingNumber`**).
5. **Quản trị Danh mục TTHC & Phiên đăng nhập**: Quản trị viên hiệu chỉnh trực tuyến thời hạn SLA, lệ phí, cờ nhân phí bản sao (`feePerCopy`) hoặc tạm ngưng/kích hoạt TTHC tại `/he-thong/thu-tuc` (`PATCH /api/procedures` lưu vết `AuditLog`). Khi khóa tài khoản cán bộ (`isActive = false`), phiên đăng nhập JWT bị thu hồi tức thời ở mọi API nội bộ; các thao tác nhạy cảm (rút hồ sơ, xóa ngày lễ) đều yêu cầu xác nhận 02 bước trực tuyến trên giao diện.
6. **Xuất Sổ CSV (Excel)**: Nút **Xuất Sổ CSV (Excel)** tại `/he-thong/ho-so` và `/he-thong/van-ban` xuất tệp kèm ký tự dẫn hướng UTF-8 BOM (`\uFEFF`) hiển thị chuẩn tiếng Việt trên Excel và tự động trung hòa ký tự công thức độc hại (`=`, `+`, `-`, `@`) theo chuẩn OWASP.

### 5.2. Hệ thống 06 Biểu mẫu Hành chính Chuẩn Khổ A4 (`src/components/OfficialFormsPrint.tsx`)
Hỗ trợ xem trước và in chuẩn khổ giấy A4 (`@media print`, đóng nhanh bằng phím `Escape`):
- **Mẫu số 01**: Giấy tiếp nhận hồ sơ và hẹn trả kết quả (`.../GTN-BPTNTKQ`).
- **Mẫu số 02**: Phiếu yêu cầu bổ sung, hoàn thiện hồ sơ (`.../PYCBS-BPTNTKQ`).
- **Mẫu số 03**: Phiếu từ chối tiếp nhận giải quyết hồ sơ (`.../PTCTN-BPTNTKQ`).
- **Mẫu số 04**: Phiếu xin lỗi và hẹn lại ngày trả kết quả (`PXL-2026-XXXX`).
- **Mẫu số 05**: Phiếu kiểm soát quá trình giải quyết hồ sơ (`.../PKS-BPTNTKQ` — tổng hợp đầy đủ bảng lưu vết người giao, người nhận, thời gian và trạng thái từng bước).
- **Mẫu CTT50**: Biên lai thu tiền phí, lệ phí hành chính (`BL-2026-XXXX` — tự động đọc số tiền thành chữ tiếng Việt).

---

## 6. Danh sách Hồ sơ Mẫu Phục vụ Kiểm thử Nhanh

| Mã hồ sơ | Mã PIN | Trạng thái gốc | Kịch bản kiểm thử khuyến nghị |
|---|---|---|---|
| `HS-20261111-0001` | `482910` | `MOI_NOP` | Đăng nhập `motcua` để tiếp nhận hồ sơ mới nộp và cấp Giấy hẹn Mẫu 01 |
| `HS-20261109-0004` | `845129` | `YEU_CAU_BO_SUNG` | Tra cứu kèm Mã PIN tại `/tra-cuu` để nộp bổ sung trực tuyến và kiểm tra cộng bù SLA trong giờ hành chính |
| `HS-20261110-0005` | `391042` | `CHO_PHE_DUYET` | Đăng nhập `lanhdao` ký duyệt ban hành kết quả & kiểm tra tự động ghi Sổ Văn bản đi |
| `HS-20261106-0006` | `528173` | `CHO_TRA_KET_QUA` | Chưa thu lệ phí 20.000đ — Kiểm thử chốt chặn khóa trả kết quả trước khi thu phí & đối chiếu VB đi `312/GXN-UBND` |
| `HS-20261103-0009` | `673820` | `DANG_THAM_DINH` | Hồ sơ quá hạn SLA — Kiểm thử chức năng Gia hạn tối đa 01 lần & Xuất Phiếu xin lỗi Mẫu 04 |
