# Hệ thống Thông tin Quản lý Hành chính & Một cửa Điện tử — UBND Phường Thanh Nhàn (HTTTHC v2.1)

> Nền tảng Cổng Dịch vụ công trực tuyến kết hợp Bàn làm việc Một cửa liên thông, Điều hành Văn bản và Giám sát Bộ chỉ số phục vụ người dân, doanh nghiệp (Quyết định 766/QĐ-TTg) — triển khai cho **UBND Phường Thanh Nhàn, Thành phố Hà Nội**.

---

## 1. Tính năng Nghiệp vụ Trọng tâm

- **Cổng Dịch vụ công & Tra cứu Công khai (`/`, `/thu-tuc`, `/nop-ho-so`, `/tra-cuu`, `/ho-so-cua-toi`)**:
  - Niêm yết công khai Danh mục Thủ tục hành chính (thành phần bắt buộc, căn cứ pháp lý, thời hạn SLA, mức thu & đối tượng miễn lệ phí).
  - Nộp hồ sơ trực tuyến kèm **tái sử dụng giấy tờ số hóa 1 chạm từ Kho dữ liệu điện tử cá nhân** (Điều 11 Nghị định 45/2020/NĐ-CP) và tự động tính phí nhân theo số bản sao (`feePerCopy`).
  - Tra cứu tiến độ ẩn danh bảo vệ dữ liệu cá nhân mặc định; mở khóa toàn văn bằng **Mã PIN 6 chữ số** (`crypto.randomInt`) để in biểu mẫu A4, nộp bổ sung Mẫu 02, thanh toán lệ phí trực tuyến, rút hồ sơ xác nhận 2 bước và đánh giá hài lòng **SIPAS** (chống gửi trùng `409`).
- **Máy trạng thái Hồ sơ Một cửa 09 bước (`src/lib/workflow-engine.ts`)**:
  - Tiếp nhận 01 bước tại quầy (`autoAccept`) tự động phân công chuyên viên ít tải nhất (`pickLeastLoadedSpecialist`), điều chuyển chuyên viên cùng phòng (`CHUYEN_CHUYEN_VIEN`).
  - Chốt chặn pháp lý Nghị định 61/2018/NĐ-CP & 107/2021/NĐ-CP: Yêu cầu bổ sung **tối đa 01 lần** (kèm theo dõi hạn 15 ngày làm việc `supplementDeadline`), Gia hạn kèm Phiếu xin lỗi **tối đa 01 lần**, đối chiếu đủ 100% thành phần bắt buộc trước khi trình ký, khóa cứng trả kết quả nếu chưa thu lệ phí (`DA_THU_PHI`).
- **Động cơ Tính hạn SLA Hai Ca Hành chính (`src/lib/sla-engine.ts`)**:
  - Chuẩn 02 ca hành chính `07:30 – 11:30` và `13:00 – 17:00` (`480` phút/ngày), loại trừ Thứ Bảy, Chủ Nhật và Lịch nghỉ lễ động (`Holiday`), tự động đo & cộng bù chính xác từng phút làm việc bị tạm dừng khi chờ công dân bổ sung hồ sơ.
- **Quản lý Văn bản, Biểu mẫu Khổ A4 & Kiểm toán Bất biến**:
  - Sổ Văn bản đến/đi cấp số nguyên tử (`SequenceCounter`), phân quyền độ mật `THUONG` / `MAT` / `TOI_MAT` (Nghị định 30/2020/NĐ-CP), bút phê giao việc, trả lại dự thảo (`TRA_LAI_DU_THAO`), liên thông kết quả TTHC sang Sổ Văn bản đi.
  - Xem trước & in trực tiếp **06 Biểu mẫu hành chính chuẩn khổ A4** (Mẫu 01–05 Thông tư 01/2018/TT-VPCP & Biên lai CTT50) qua React Portal `@media print`.
  - Xuất Sổ theo dõi CSV chuẩn UTF-8 BOM chống CSV Formula Injection và lưu vết kiểm toán bất biến (`AuditLog`) kèm địa chỉ IP.

---

## 2. Kiến trúc Công nghệ

| Thành phần | Công nghệ |
|---|---|
| **Framework & UI** | Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS v4 |
| **Cơ sở dữ liệu & ORM** | PostgreSQL 15 (Docker Compose), Prisma ORM 6 |
| **Xác thực & Phân quyền** | JWT HttpOnly Cookie (`jose`) + Đối chiếu `isActive` thời gian thực từ DB, RBAC (5 vai trò) & ABAC (theo Phòng ban & Độ mật văn bản) |
| **Kiểm định dữ liệu** | Zod Schema Validation toàn diện đầu vào API |

---

## 3. Khởi chạy Nhanh (Quick Start)

### Bước 1: Chuẩn bị biến môi trường & Cơ sở dữ liệu
```bash
cp .env.example .env
# Cập nhật mật khẩu DATABASE_URL khớp với docker-compose.yml và JWT_SECRET
docker compose up -d db
```

### Bước 2: Cài đặt thư viện, Khởi tạo Schema & Nạp dữ liệu mẫu
```bash
npm install
npm run db:setup
```

### Bước 3: Chạy ứng dụng
```bash
# Chế độ phát triển
npm run dev

# Hoặc biên dịch & chạy Production trên cổng 3000
npm run build
npm start
```

Truy cập cổng tại: `http://localhost:3000`

---

## 4. Tài khoản Thực hành Mẫu

Mật khẩu mặc định trong môi trường thực hành nội bộ (`prisma/seed.ts`): **`HanhChinh@2026`**

| Vai trò | Tài khoản | Đơn vị / Phạm vi |
|---|---|---|
| Cán bộ Một cửa | `motcua` | Bộ phận Tiếp nhận và Trả kết quả |
| Chuyên viên Tư pháp | `chuyenvien.tuphap` | Bộ phận Tư pháp - Hộ tịch |
| Chuyên viên Địa chính | `chuyenvien.diachinh` | Bộ phận Địa chính - Xây dựng |
| Chuyên viên VH-XH | `chuyenvien.vhxh` | Bộ phận Văn hóa - Xã hội |
| Chuyên viên Kinh tế | `chuyenvien.kinhte` | Bộ phận Kinh tế - Tài chính |
| Lãnh đạo UBND | `lanhdao` | Chủ tịch UBND Phường |
| Quản trị & Văn thư | `quantri` | Chánh Văn phòng |
| Công dân | `congdan`, `congdan2` | Tài khoản Công dân xác thực |

---

## 5. Tài liệu Hệ thống

- [SO_TAY_NGHIEP_VU.md](./SO_TAY_NGHIEP_VU.md) — Sổ tay Nghiệp vụ & Hướng dẫn sử dụng chi tiết (User Guide v2.0, đồng bộ với trang `/so-tay-nghiep-vu`).
- [he-thong-quan-ly-hanh-chinh.md](./he-thong-quan-ly-hanh-chinh.md) — Đặc tả kiến trúc kỹ thuật và thiết kế nghiệp vụ tổng thể.
- [WORK_LOG.md](./WORK_LOG.md) — Nhật ký triển khai và đối soát 07 vòng kiểm định chuyên sâu.
