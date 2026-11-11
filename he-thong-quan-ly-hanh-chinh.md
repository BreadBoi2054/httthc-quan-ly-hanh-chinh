# Kế Hoạch Triển Khai Hệ Thống Thông Tin Quản Lý Hành Chính (HTTTHC)

## 1. Tổng Quan Dự Án (Overview)
Xây dựng trọn gói **Hệ thống Thông tin Quản lý Hành chính & Một cửa Điện tử — UBND Phường Thanh Nhàn (HTTTHC)** phục vụ song song hai đối tượng: **Công dân / Tổ chức** (tra cứu thủ tục hành chính, nộp hồ sơ trực tuyến, bổ sung hồ sơ, nộp lệ phí trực tuyến, rút hồ sơ, tra cứu tiến độ theo mã biên nhận & Mã PIN, đánh giá sự hài lòng SIPAS) và **Cán bộ Cơ quan Hành chính** (Một cửa, Chuyên viên chuyên môn, Lãnh đạo UBND, Quản trị - Văn thư lưu trữ). Giao diện mang đậm bản sắc Cổng Dịch vụ công Hành chính Việt Nam (Nền Vàng kem Hoàng gia `#FCE8A6` / `#FFF1BD`, Đỏ cờ tươi `#CE1126` / `#D71920`, Trắng sáng `#FFFFFF` & Xám sáng `#F3F4F6`, họa tiết Trống đồng Đông Sơn & Hoa sen SVG tự dựng), **tuyệt đối không sử dụng hay trỏ tới bất kỳ tên miền cổng công quyền cấp quốc gia nào** (chỉ vận hành độc lập dưới tên miền nội bộ mô phỏng `httthc.noibo.vn`).

## 2. Phân Loại Dự Án (Project Type)
- **Loại dự án:** `WEB` (Full-stack Web Application: Public Administrative Portal + Internal E-Office / One-Stop-Shop Workspace)
- **Môi trường triển khai:** Tận dụng trực tiếp `Docker` có sẵn trên máy (image `postgres:15-alpine` sẵn có local, chạy container `httthc-db` tại cổng `54322`) kết hợp `Node.js v24.14.1` cho Next.js 15.5 App Router (chạy production server tại `http://localhost:3000`) cùng cấu hình `Dockerfile` & `docker-compose.yml` đồng bộ.

## 3. Tiêu Chí Thành Công (Success Criteria)
1. **Nghiệp vụ hành chính chặt chẽ 100%:**
   - Máy trạng thái (State Machine) kiểm soát nghiêm ngặt quy trình Một cửa liên thông 9 trạng thái (Tiếp nhận → Thẩm định → Trình ký → Phê duyệt → Thu phí → Trả kết quả; nhánh Yêu cầu bổ sung tạm dừng SLA & tự động cộng bù hạn trả trong khung giờ hành chính `08:00–17:00`; nhánh Từ chối tiếp nhận bắt buộc nêu lý do và căn cứ pháp lý; nhánh Quá hạn / Gia hạn tối đa 01 lần bắt buộc lập Phiếu xin lỗi Mẫu 04; Rút hồ sơ trước khi ký duyệt và hoàn phí tự động).
   - Tự động tính **Ngày hẹn trả kết quả** theo ngày làm việc thực tế (loại trừ Thứ Bảy, Chủ Nhật và danh mục Ngày nghỉ lễ cấu hình động trong CSDL).
   - Chặn cứng việc **Trả kết quả (`HOAN_THANH`)** nếu hồ sơ có lệ phí (`feeAmount > 0`, không thuộc diện miễn giảm) mà chưa thu lệ phí / xuất biên lai điện tử (`BL-2026-XXXX`).
   - Phân hệ **Quản lý Văn bản & Điều hành** (Văn bản đến cấp số liên tiếp tự động, Bút phê chỉ đạo của Lãnh đạo, Văn bản đi ký ban hành, tự động liên thông văn bản kết quả giải quyết TTHC).
   - Xuất trực tiếp **06 biểu mẫu hành chính chuẩn khổ A4** có Quốc hiệu - Tiêu ngữ (Mẫu 01, Mẫu 02, Mẫu 03, Mẫu 04, Mẫu 05, Biên lai thu lệ phí) và **Xuất Sổ đăng ký CSV (Excel UTF-8 BOM)**.
2. **Tuân thủ tuyệt đối ràng buộc giao diện & an toàn liên kết:**
   - Hoàn toàn không chứa bất kỳ đường dẫn tên miền cơ quan nhà nước thực tế nào trong toàn bộ mã nguồn, dữ liệu mẫu và tài liệu.
   - Không sử dụng các tông màu ngoại lai ngoài bảng màu hành chính Việt Nam; mọi con số thống kê Bộ chỉ số Quyết định 766 tính toán thực tế từ CSDL PostgreSQL, khớp tổng toán học 100%.
3. **Tài liệu & Nhật ký đầy đủ:**
   - Có `SO_TAY_NGHIEP_VU.md` và trang `/so-tay-nghiep-vu` trực tuyến hướng dẫn chi tiết từng vai trò & quy trình.
   - Có `WORK_LOG.md` ghi chép minh bạch toàn bộ quá trình xây dựng, **4 vòng Quét tổng quan ban đầu** và **3 vòng Quét chuyên sâu Nghiệp vụ & Giao diện tiếp theo (tổng cộng 7 vòng Audit & Fix)**.
4. **Kiểm thử tự động qua MCP Playwright & 7 vòng Quét - Giải quyết:**
   - Chạy kiểm thử trình duyệt thực tế bằng MCP Playwright.
   - Hoàn thành trọn vẹn **Vòng 1–4** (Quét tổng quan & chuẩn hóa nền tảng) và **Vòng Chuyên sâu 1/3, 2/3, 3/3 (Vòng 5–7)** kiểm định pháp lý NĐ 61/2018, NĐ 45/2020, NĐ 30/2020, QĐ 766/QĐ-TTg, Portal in khổ A4 và chuẩn tiếp cận WCAG AA.

## 4. Công Nghệ Sử Dụng (Tech Stack)
| Thành phần | Lựa chọn | Lý do kỹ thuật |
|---|---|---|
| **Frontend & Backend** | Next.js 15.5.29 (App Router, TypeScript Strict) | Đồng nhất kiểu dữ liệu đầu-cuối, Server Components tối ưu tốc độ tải và Route Handlers chuẩn REST API |
| **CSDL** | PostgreSQL 15 (`postgres:15-alpine` qua Docker) | Image có sẵn trong máy, đảm bảo toàn vẹn giao dịch ACID cho hồ sơ hành chính & đánh số tự động |
| **ORM & Migration** | Prisma ORM 6.19 | Định nghĩa schema chặt chẽ, quan hệ khóa ngoại, enum trạng thái và index truy vấn SLA |
| **Xác thực & Phân quyền** | JWT HttpOnly Cookie (`jose` Edge-safe + `bcryptjs`) | Phân quyền RBAC 5 vai trò kết hợp ABAC theo phòng ban chuyên môn |
| **Validation** | Zod | Kiểm tra chặt dữ liệu đầu vào (CCCD 12 số, SĐT Việt Nam, giới hạn kích thước mảng, điều kiện chuyển trạng thái) |
| **Styling** | Tailwind CSS v4 + CSS Custom Tokens | Hệ thống màu hành chính Việt Nam, chế độ in ấn `@media print` chuẩn khổ A4 |
| **E2E Verification** | MCP Playwright | Kiểm thử trực tiếp giao diện Desktop & Mobile, luồng nghiệp vụ đa vai trò, kiểm tra console errors |

## 5. Cấu Trúc Thư Mục (File Structure)
```text
HTTTHC/
├── docker-compose.yml               # Khởi chạy PostgreSQL 15 (tận dụng image có sẵn) & cấu hình container web
├── Dockerfile                       # Đóng gói ứng dụng web chuẩn multi-stage standalone
├── prisma/
│   ├── schema.prisma                # Mô hình dữ liệu hành chính (Users, Departments, Procedures, Dossiers, Documents, Holidays, AuditLogs)
│   └── seed.ts                      # Dữ liệu chuẩn hóa thực tế (5 bộ phận, 8 TTHC, 9 tài khoản 5 vai trò, 10 hồ sơ đa trạng thái, 6 văn bản đến/đi)
├── src/
│   ├── app/
│   │   ├── page.tsx, thu-tuc/, nop-ho-so/, tra-cuu/, ho-so-cua-toi/, so-tay-nghiep-vu/
│   │   ├── dang-nhap/               # Đăng nhập Cán bộ & Công dân (chống Open Redirect, hỗ trợ chọn nhanh tài khoản kiểm thử)
│   │   ├── he-thong/                # Bàn làm việc Nội bộ (Tổng quan SLA, Hồ sơ Một cửa, Văn bản đến/đi, Danh mục TTHC, Quản trị & AuditLog)
│   │   └── api/                     # Hệ thống REST API có kiểm tra RBAC, ABAC, State Machine & lưu vết IP AuditLog
│   ├── components/                  # Header/Footer hành chính, Biểu trưng Trống đồng SVG, 06 Biểu mẫu in A4, StatusBadges
│   └── lib/
│       ├── db.ts                    # Kết nối Prisma PostgreSQL
│       ├── jwt-edge.ts & auth.ts    # Xác thực JWT Edge-safe + kiểm tra User.isActive trực tiếp trên CSDL & trích xuất IP kiểm toán
│       ├── sequence.ts              # Cấp số thứ tự nguyên tử (SequenceCounter) chống đụng độ đa luồng cho Hồ sơ, Biên lai, KQĐT, VB đến/đi
│       ├── sla-engine.ts            # Thuật toán 2 ca hành chính (07:30-11:30 & 13:00-17:00 = 480p/ngày), trừ T7/CN & Lễ, bù phút làm việc
│       ├── specialist-assignment.ts # Tự động cân bằng tải phân công chuyên viên thụ lý ít hồ sơ nhất trong phòng ban
│       ├── workflow-engine.ts       # Máy trạng thái Một cửa 9 trạng thái, tối đa 01 lần bổ sung & 01 lần gia hạn, khóa trả kết quả khi nợ phí
│       ├── csv-export.ts            # Xuất Sổ đăng ký CSV chuẩn UTF-8 BOM cho Excel & chống CSV Formula Injection
│       └── validations.ts           # Schema kiểm tra đầu vào chặt chẽ bằng Zod
├── SO_TAY_NGHIEP_VU.md              # Sổ tay hướng dẫn nghiệp vụ v2.0 toàn diện cho Công dân & 4 nhóm Cán bộ
├── WORK_LOG.md                      # Nhật ký thực thi & báo cáo chi tiết 7 vòng Quét - Khắc phục (Vòng 1–4 + Vòng Chuyên sâu 1/3–3/3)
└── he-thong-quan-ly-hanh-chinh.md   # Tệp kế hoạch dự án
```

## 6. Phân Rã Nhiệm Vụ (Task Breakdown)
- [x] **Task 1: Khởi tạo Kế hoạch & Nhật ký thực thi** (`@project-planner`, `@plan-writing`)
- [x] **Task 2: Dựng Hạ tầng Docker PostgreSQL 15 & Khung dự án Next.js TypeScript** (`@devops-engineer`, `@deployment-procedures`)
- [x] **Task 3: Thiết kế Schema CSDL Hành chính & Dữ liệu Mẫu Chuẩn Nghiệp vụ** (`@database-architect`, `@database-design`)
- [x] **Task 4: Xây dựng Lõi Nghiệp vụ Backend (SLA Engine, State Machine, RBAC/ABAC APIs)** (`@backend-specialist` + `@security-auditor`)
- [x] **Task 5: Xây dựng Giao diện Cổng Hành chính Công & Bàn làm việc Nội bộ + 06 Biểu mẫu In A4** (`@frontend-specialist`, `@frontend-design`)
- [x] **Task 6: Biên soạn Sổ tay Nghiệp vụ (`SO_TAY_NGHIEP_VU.md` & Trang Web tích hợp)** (`@documentation-writer`, `@documentation-templates`)
- [x] **Task 7: Triển khai Hệ thống & Kiểm thử MCP Playwright + Vòng Quét & Giải quyết Lần 1** (`@test-engineer` + `@debugger`)
- [x] **Task 8: Thực hiện tiếp 3 Vòng Quét chuyên sâu & Giải quyết triệt để (Vòng 2, Vòng 3, Vòng 4)** (`@security-auditor` + `@backend-specialist` + `@frontend-specialist` + `@test-engineer`)
- [x] **Task 9: Thực hiện 3 Vòng Quét Sâu Nghiệp vụ Pháp lý & Giao diện UX (Vòng Chuyên sâu 1/3, 2/3, 3/3 — Vòng 5, 6, 7)** (`@orchestrator` + Subagent Kiểm toán Độc lập + MCP Playwright)

## 7. Phase X: Final Verification Checklist
- [x] `npx tsc --noEmit` & `npm run build` thành công 100% (`0` lỗi, `0` cảnh báo trên toàn bộ 24 tuyến)
- [x] Quét tự động toàn bộ dự án đảm bảo **0 chuỗi tên miền công quyền bị cấm**
- [x] Quét tự động toàn bộ dự án đảm bảo **0 mã màu cấm ngoài bảng màu hành chính**
- [x] Kiểm thử đầu-cuối (E2E) toàn bộ luồng Công dân → Một cửa → Chuyên viên → Lãnh đạo → Thu phí → Trả kết quả → Đánh giá hài lòng qua **MCP Playwright**
- [x] Hoàn tất đầy đủ **7 vòng Quét & Giải quyết (gồm 3 vòng Chuyên sâu theo yêu cầu mới nhất)** và ghi nhận minh bạch trong `WORK_LOG.md`

## ✅ PHASE X COMPLETE (v2.0 — 7 AUDIT ROUNDS)
- Lint & TypeScript: ✅ Pass (`0 errors`, `0 warnings` trên `npx tsc --noEmit` và `npm run build`)
- Security, RBAC & ABAC: ✅ Kiểm soát chặt 5 vai trò RBAC + cách ly phòng ban ABAC + phân quyền Văn bản Mật NĐ 30/2020, thu hồi phiên tức thời qua `User.isActive`, PIN mật mã học `crypto.randomInt`, chống ghi đè SIPAS, lưu vết IP `AuditLog`
- Build & Production Runtime: ✅ Next.js 15.5.29 Production (`http://localhost:3000`) + Docker PostgreSQL 15 (`httthc-db:54322`) hoạt động ổn định
- E2E MCP Playwright & 7 Audit Rounds: ✅ Hoàn thành trọn vẹn 4 vòng đầu + 3 vòng Chuyên sâu trên cả Desktop `1440x900` và Mobile `390x844`, in ấn Portal A4 chuẩn xác, `0` lỗi Console trình duyệt
- Date: 2026-11-11
