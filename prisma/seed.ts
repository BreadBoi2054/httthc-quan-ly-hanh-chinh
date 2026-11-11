import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateDueDate } from "../src/lib/sla-engine";

const prisma = new PrismaClient();

async function main() {
  console.log("[SEED] Bat dau khoi tao du lieu He thong Thong tin Quan ly Hanh chinh...");

  await prisma.auditLog.deleteMany();
  await prisma.sequenceCounter.deleteMany();
  await prisma.officialDocument.deleteMany();
  await prisma.dossierHistory.deleteMany();
  await prisma.dossierAttachment.deleteMany();
  await prisma.dossier.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.holiday.deleteMany();

  // 1. Lịch nghỉ lễ hành chính năm 2026
  const holidays = [
    { dateStr: "2026-01-01", name: "Tết Dương lịch 2026", year: 2026 },
    { dateStr: "2026-02-16", name: "Nghỉ Tết Nguyên đán Bính Ngọ", year: 2026 },
    { dateStr: "2026-02-17", name: "Mùng 1 Tết Nguyên đán Bính Ngọ", year: 2026 },
    { dateStr: "2026-02-18", name: "Mùng 2 Tết Nguyên đán Bính Ngọ", year: 2026 },
    { dateStr: "2026-02-19", name: "Mùng 3 Tết Nguyên đán Bính Ngọ", year: 2026 },
    { dateStr: "2026-02-20", name: "Nghỉ Tết Nguyên đán Bính Ngọ", year: 2026 },
    { dateStr: "2026-04-27", name: "Nghỉ bù Giỗ Tổ Hùng Vương (10/3 ÂL)", year: 2026 },
    { dateStr: "2026-04-30", name: "Ngày Chiến thắng 30/4", year: 2026 },
    { dateStr: "2026-05-01", name: "Ngày Quốc tế Lao động 1/5", year: 2026 },
    { dateStr: "2026-09-02", name: "Quốc khánh nước CHXHCN Việt Nam 2/9", year: 2026 },
    { dateStr: "2026-09-03", name: "Nghỉ lễ Quốc khánh 2/9", year: 2026 },
  ];
  await prisma.holiday.createMany({ data: holidays });
  const holidayDateStrings = holidays.map((h) => h.dateStr);

  // 2. Cơ cấu Phòng ban / Bộ phận chuyên môn
  const deptMotCua = await prisma.department.create({
    data: {
      code: "BP-MC",
      name: "Bộ phận Tiếp nhận và Trả kết quả (Một cửa)",
      headTitle: "Trưởng Bộ phận Một cửa",
      phoneExt: "101",
      roomNumber: "Quầy số 01 - 04, Tầng 1",
    },
  });

  const deptTuPhap = await prisma.department.create({
    data: {
      code: "TP-HT",
      name: "Bộ phận Tư pháp - Hộ tịch",
      headTitle: "Công chức Tư pháp - Hộ tịch phụ trách",
      phoneExt: "102",
      roomNumber: "Phòng 102, Tầng 1",
    },
  });

  const deptDiaChinh = await prisma.department.create({
    data: {
      code: "DC-XD",
      name: "Bộ phận Địa chính - Xây dựng - Đô thị & Môi trường",
      headTitle: "Công chức Địa chính - Xây dựng phụ trách",
      phoneExt: "201",
      roomNumber: "Phòng 201, Tầng 2",
    },
  });

  const deptVanHoa = await prisma.department.create({
    data: {
      code: "VH-XH",
      name: "Bộ phận Văn hóa - Xã hội & Lao động Thương binh",
      headTitle: "Công chức Văn hóa - Xã hội phụ trách",
      phoneExt: "202",
      roomNumber: "Phòng 202, Tầng 2",
    },
  });

  const deptKinhTe = await prisma.department.create({
    data: {
      code: "KT-TC",
      name: "Bộ phận Kinh tế - Tài chính - Kế hoạch",
      headTitle: "Công chức Tài chính - Kế toán phụ trách",
      phoneExt: "203",
      roomNumber: "Phòng 203, Tầng 2",
    },
  });

  // 3. Tài khoản Cán bộ & Công dân (5 Vai trò RBAC)
  const passwordHash = await bcrypt.hash("HanhChinh@2026", 10);

  const userQuanTri = await prisma.user.create({
    data: {
      username: "quantri",
      email: "quantri@httthc.noibo.vn",
      passwordHash,
      fullName: "Nguyễn Văn Minh",
      citizenId: "079084001102",
      phone: "0903112233",
      positionTitle: "Chánh Văn phòng - Quản trị Hệ thống & Văn thư",
      role: "QUAN_TRI",
      departmentId: deptMotCua.id,
    },
  });

  const userLanhDao = await prisma.user.create({
    data: {
      username: "lanhdao",
      email: "ctubnd@httthc.noibo.vn",
      passwordHash,
      fullName: "Trần Quốc Bảo",
      citizenId: "079078002219",
      phone: "0903889900",
      positionTitle: "Chủ tịch UBND Phường",
      role: "LANH_DAO",
      departmentId: deptMotCua.id,
    },
  });

  const userMotCua = await prisma.user.create({
    data: {
      username: "motcua",
      email: "motcua01@httthc.noibo.vn",
      passwordHash,
      fullName: "Lê Thị Thu Hà",
      citizenId: "079193005411",
      phone: "0908445566",
      positionTitle: "Công chức Tiếp nhận và Trả kết quả",
      role: "MOT_CUA",
      departmentId: deptMotCua.id,
    },
  });

  const userCvTuPhap = await prisma.user.create({
    data: {
      username: "chuyenvien.tuphap",
      email: "tuphap@httthc.noibo.vn",
      passwordHash,
      fullName: "Phạm Hoàng Nam",
      citizenId: "079090003318",
      phone: "0912334455",
      positionTitle: "Công chức Tư pháp - Hộ tịch",
      role: "CHUYEN_VIEN",
      departmentId: deptTuPhap.id,
    },
  });

  const userCvDiaChinh = await prisma.user.create({
    data: {
      username: "chuyenvien.diachinh",
      email: "diachinh@httthc.noibo.vn",
      passwordHash,
      fullName: "Vũ Đình Khôi",
      citizenId: "079089007721",
      phone: "0915667788",
      positionTitle: "Công chức Địa chính - Xây dựng",
      role: "CHUYEN_VIEN",
      departmentId: deptDiaChinh.id,
    },
  });

  const userCvVanHoa = await prisma.user.create({
    data: {
      username: "chuyenvien.vhxh",
      email: "vhxh@httthc.noibo.vn",
      passwordHash,
      fullName: "Đặng Mai Phương",
      citizenId: "079194006105",
      phone: "0988223344",
      positionTitle: "Công chức Văn hóa - Xã hội",
      role: "CHUYEN_VIEN",
      departmentId: deptVanHoa.id,
    },
  });

  const userCvKinhTe = await prisma.user.create({
    data: {
      username: "chuyenvien.kinhte",
      email: "kinhte@httthc.noibo.vn",
      passwordHash,
      fullName: "Ngô Gia Huy",
      citizenId: "079091009412",
      phone: "0977556677",
      positionTitle: "Công chức Tài chính - Kế hoạch",
      role: "CHUYEN_VIEN",
      departmentId: deptKinhTe.id,
    },
  });

  const userCongDan1 = await prisma.user.create({
    data: {
      username: "congdan",
      email: "hoangminhtuan@congdan.noibo.vn",
      passwordHash,
      fullName: "Hoàng Minh Tuấn",
      citizenId: "079092004518",
      phone: "0938123456",
      address: "Số 42 Phố Thanh Nhàn, Tổ dân phố số 3, Phường Thanh Nhàn",
      role: "CONG_DAN",
    },
  });

  const userCongDan2 = await prisma.user.create({
    data: {
      username: "congdan2",
      email: "bichngoc@congdan.noibo.vn",
      passwordHash,
      fullName: "Nguyễn Thị Bích Ngọc",
      citizenId: "079195008234",
      phone: "0949654321",
      address: "Số 118 Phố Kim Ngưu, Tổ dân phố số 6, Phường Thanh Nhàn",
      role: "CONG_DAN",
    },
  });

  // 4. Danh mục Thủ tục Hành chính chuẩn hóa
  const procKhaiSinh = await prisma.procedure.create({
    data: {
      code: "1.000894",
      name: "Đăng ký khai sinh (thông thường và liên thông)",
      field: "Hộ tịch - Chứng thực",
      serviceLevel: "TOAN_TRINH",
      processingDays: 1,
      processingHours: 8,
      feeAmount: 0,
      feeExemptionNote: "Miễn lệ phí đăng ký khai sinh đúng hạn cho công dân Việt Nam theo Luật Hộ tịch.",
      legalBasis: "Luật Hộ tịch số 60/2014/QH13; Nghị định số 123/2015/NĐ-CP; Thông tư số 04/2020/TT-BTP.",
      executionSteps:
        "Bước 1: Người yêu cầu nộp tờ khai điện tử và đính kèm Giấy chứng sinh.\nBước 2: Bộ phận Một cửa kiểm tra tính đầy đủ, cấp Giấy tiếp nhận (Mẫu 01).\nBước 3: Công chức Tư pháp - Hộ tịch đối chiếu CSDL dân cư, ghi vào Sổ đăng ký khai sinh.\nBước 4: Lãnh đạo UBND ký cấp Giấy khai sinh bản chính và bản điện tử.",
      requiredDocsJson: JSON.stringify([
        { code: "TK-KS-01", name: "Tờ khai đăng ký khai sinh theo mẫu quy định", mandatory: true },
        { code: "GCS-BV", name: "Giấy chứng sinh do cơ sở y tế cấp (bản chính hoặc bản điện tử)", mandatory: true },
        { code: "GCN-KH", name: "Giấy chứng nhận kết hôn của cha mẹ (nếu đã đăng ký kết hôn)", mandatory: false },
      ]),
      resultTemplate: "Giấy khai sinh (Bản chính + Bản sao trích lục điện tử)",
      departmentId: deptTuPhap.id,
    },
  });

  const procHonNhan = await prisma.procedure.create({
    data: {
      code: "1.001193",
      name: "Cấp Giấy xác nhận tình trạng hôn nhân",
      field: "Hộ tịch - Chứng thực",
      serviceLevel: "TOAN_TRINH",
      processingDays: 3,
      processingHours: 24,
      feeAmount: 20000,
      feeExemptionNote: "Miễn lệ phí cho người thuộc gia đình có công với cách mạng, người thuộc hộ nghèo, người khuyết tật.",
      legalBasis: "Điều 21, 22, 23 Nghị định số 123/2015/NĐ-CP; Thông tư số 85/2019/TT-BTC về lệ phí hộ tịch.",
      executionSteps:
        "Bước 1: Người yêu cầu nộp hồ sơ trực tuyến hoặc tại Bộ phận Một cửa.\nBước 2: Một cửa tiếp nhận và chuyển Công chức Tư pháp - Hộ tịch.\nBước 3: Xác minh tình trạng hôn nhân trong thời hạn tối đa 03 ngày làm việc.\nBước 4: Trình Chủ tịch UBND ký cấp Giấy xác nhận tình trạng hôn nhân, thu lệ phí và trả kết quả.",
      requiredDocsJson: JSON.stringify([
        { code: "TK-TTHN", name: "Tờ khai cấp Giấy xác nhận tình trạng hôn nhân", mandatory: true },
        { code: "CCCD-CD", name: "Bản chụp Căn cước công dân còn hiệu lực", mandatory: true },
        { code: "BA-LH", name: "Bản án/Quyết định ly hôn đã có hiệu lực pháp luật (nếu đã ly hôn)", mandatory: false },
      ]),
      resultTemplate: "Giấy xác nhận tình trạng hôn nhân",
      departmentId: deptTuPhap.id,
    },
  });

  const procChungThuc = await prisma.procedure.create({
    data: {
      code: "1.000625",
      name: "Chứng thực bản sao từ bản chính giấy tờ, văn bản",
      field: "Hộ tịch - Chứng thực",
      serviceLevel: "MOT_PHAN",
      processingDays: 0,
      processingHours: 4,
      feeAmount: 10000,
      feePerCopy: true,
      feeExemptionNote: "Thu theo định mức 2.000 đồng/trang từ trang thứ nhất đến trang thứ hai; từ trang thứ ba trở lên thu 1.000 đồng/trang.",
      legalBasis: "Nghị định số 23/2015/NĐ-CP về cấp bản sao từ sổ gốc, chứng thực bản sao từ bản chính; Thông tư số 226/2016/TT-BTC.",
      executionSteps:
        "Bước 1: Xuất trình bản chính và bản chụp cần chứng thực tại Bộ phận Một cửa.\nBước 2: Kiểm tra tính hợp pháp của bản chính, đối chiếu bản sao.\nBước 3: Lãnh đạo ký chứng thực, đóng dấu, thu lệ phí và trả kết quả ngay trong ngày làm việc.",
      requiredDocsJson: JSON.stringify([
        { code: "BC-GOC", name: "Bản chính giấy tờ, văn bản làm cơ sở để chứng thực bản sao", mandatory: true },
        { code: "BS-CHUP", name: "Bản chụp giấy tờ, văn bản cần chứng thực", mandatory: true },
      ]),
      resultTemplate: "Bản sao được chứng thực từ bản chính",
      departmentId: deptTuPhap.id,
    },
  });

  const procKetHon = await prisma.procedure.create({
    data: {
      code: "1.004218",
      name: "Đăng ký kết hôn (trong nước)",
      field: "Hộ tịch - Chứng thực",
      serviceLevel: "MOT_PHAN",
      processingDays: 3,
      processingHours: 24,
      feeAmount: 0,
      feeExemptionNote: "Miễn lệ phí đăng ký kết hôn giữa công dân Việt Nam cư trú ở trong nước.",
      legalBasis: "Điều 17, 18 Luật Hộ tịch năm 2014; Điều 10 Nghị định số 123/2015/NĐ-CP.",
      executionSteps:
        "Bước 1: Hai bên nam, nữ nộp tờ khai đăng ký kết hôn và giấy xác nhận tình trạng hôn nhân.\nBước 2: Công chức Tư pháp - Hộ tịch thẩm tra điều kiện kết hôn theo Luật Hôn nhân và Gia đình.\nBước 3: Lãnh đạo UBND ký Giấy chứng nhận kết hôn; hai bên nam nữ có mặt ký sổ và nhận kết quả.",
      requiredDocsJson: JSON.stringify([
        { code: "TK-KH", name: "Tờ khai đăng ký kết hôn có chữ ký của hai bên nam, nữ", mandatory: true },
        { code: "GXN-HN", name: "Giấy xác nhận tình trạng hôn nhân của hai bên nam, nữ", mandatory: true },
        { code: "CCCD-2B", name: "Căn cước công dân của hai bên nam, nữ", mandatory: true },
      ]),
      resultTemplate: "Giấy chứng nhận kết hôn (02 bản chính)",
      departmentId: deptTuPhap.id,
    },
  });

  const procDatDai = await prisma.procedure.create({
    data: {
      code: "1.011402",
      name: "Xác nhận nguồn gốc và hiện trạng sử dụng đất ổn định, không tranh chấp",
      field: "Đất đai - Xây dựng",
      serviceLevel: "MOT_PHAN",
      processingDays: 5,
      processingHours: 40,
      feeAmount: 50000,
      feeExemptionNote: "Miễn lệ phí thẩm định đối với hộ nghèo, gia đình chính sách người có công.",
      legalBasis: "Luật Đất đai năm 2024; Nghị định số 101/2024/NĐ-CP quy định về điều tra cơ bản đất đai, đăng ký, cấp GCN.",
      executionSteps:
        "Bước 1: Nộp đơn đề nghị xác nhận nguồn gốc và tình trạng tranh chấp đất đai tại Một cửa.\nBước 2: Công chức Địa chính kiểm tra hồ sơ địa chính, xác minh thực địa và niêm yết lấy ý kiến khu dân cư (nếu cần).\nBước 3: Lập biên bản thẩm định và trình Chủ tịch UBND ký xác nhận.\nBước 4: Thu phí thẩm định và trả kết quả tại Bộ phận Một cửa.",
      requiredDocsJson: JSON.stringify([
        { code: "DON-DD01", name: "Đơn đề nghị xác nhận nguồn gốc và hiện trạng sử dụng đất", mandatory: true },
        { code: "GCN-SDD", name: "Giấy tờ chứng minh quyền sử dụng đất hoặc trích đo địa chính thửa đất", mandatory: true },
        { code: "CCCD-SDD", name: "Căn cước công dân của người sử dụng đất", mandatory: true },
      ]),
      resultTemplate: "Văn bản xác nhận nguồn gốc và hiện trạng sử dụng đất không tranh chấp",
      departmentId: deptDiaChinh.id,
    },
  });

  const procXayDung = await prisma.procedure.create({
    data: {
      code: "1.009812",
      name: "Phối hợp thẩm tra, cấp Giấy phép xây dựng nhà ở riêng lẻ",
      field: "Đất đai - Xây dựng",
      serviceLevel: "TOAN_TRINH",
      processingDays: 10,
      processingHours: 80,
      feeAmount: 75000,
      feeExemptionNote: "Thu lệ phí cấp phép xây dựng nhà ở riêng lẻ theo Nghị quyết HĐND cấp tỉnh.",
      legalBasis: "Luật Xây dựng năm 2014 (sửa đổi, bổ sung năm 2020); Nghị định số 15/2021/NĐ-CP.",
      executionSteps:
        "Bước 1: Chủ đầu tư nộp hồ sơ đề nghị cấp giấy phép xây dựng trực tuyến.\nBước 2: Tiếp nhận, kiểm tra thành phần bản vẽ thiết kế và giấy tờ quyền sử dụng đất.\nBước 3: Kiểm tra thực địa, đối chiếu quy hoạch phân khu và chỉ giới đường đỏ.\nBước 4: Ký ban hành Giấy phép xây dựng, thu lệ phí và trả kết quả.",
      requiredDocsJson: JSON.stringify([
        { code: "DON-GPXD", name: "Đơn đề nghị cấp giấy phép xây dựng nhà ở riêng lẻ (Mẫu số 01)", mandatory: true },
        { code: "QSDD-BS", name: "Bản sao chứng thực Giấy chứng nhận quyền sử dụng đất", mandatory: true },
        { code: "BV-TKXD", name: "Bộ bản vẽ thiết kế xây dựng (mặt bằng, mặt đứng, mặt cắt, móng)", mandatory: true },
        { code: "CK-ATLC", name: "Bản cam kết bảo đảm an toàn đối với công trình liền kề", mandatory: false },
      ]),
      resultTemplate: "Giấy phép xây dựng nhà ở riêng lẻ kèm bản vẽ đóng dấu thẩm định",
      departmentId: deptDiaChinh.id,
    },
  });

  const procTroCap = await prisma.procedure.create({
    data: {
      code: "1.003510",
      name: "Thực hiện trợ cấp xã hội hàng tháng cho người cao tuổi từ đủ 80 tuổi trở lên",
      field: "Văn hóa - Xã hội",
      serviceLevel: "TOAN_TRINH",
      processingDays: 5,
      processingHours: 40,
      feeAmount: 0,
      feeExemptionNote: "Thủ tục an sinh xã hội miễn toàn bộ phí, lệ phí (0 đồng).",
      legalBasis: "Luật Người cao tuổi; Nghị định số 20/2021/NĐ-CP quy định chính sách trợ giúp xã hội đối với đối tượng bảo trợ xã hội.",
      executionSteps:
        "Bước 1: Đối tượng hoặc người giám hộ nộp Tờ khai đề nghị trợ giúp xã hội.\nBước 2: Công chức Văn hóa - Xã hội rà soát điều kiện không có lương hưu, trợ cấp BHXH hàng tháng.\nBước 3: Niêm yết công khai kết quả xét duyệt và trình Chủ tịch UBND ký Quyết định hưởng trợ cấp.",
      requiredDocsJson: JSON.stringify([
        { code: "TK-BTXH", name: "Tờ khai đề nghị trợ giúp xã hội (Mẫu số 01 Nghị định 20/2021/NĐ-CP)", mandatory: true },
        { code: "CCCD-NCT", name: "Bản chụp Căn cước công dân / Giấy khai sinh của người cao tuổi", mandatory: true },
      ]),
      resultTemplate: "Quyết định về việc hưởng trợ cấp xã hội hàng tháng",
      departmentId: deptVanHoa.id,
    },
  });

  const procHoKinhDoanh = await prisma.procedure.create({
    data: {
      code: "1.007641",
      name: "Đăng ký thành lập Hộ kinh doanh",
      field: "Kinh tế - Tài chính",
      serviceLevel: "TOAN_TRINH",
      processingDays: 3,
      processingHours: 24,
      feeAmount: 100000,
      feeExemptionNote: "Lệ phí đăng ký hộ kinh doanh 100.000 đồng/lần cấp mới.",
      legalBasis: "Nghị định số 01/2021/NĐ-CP về đăng ký doanh nghiệp; Thông tư số 01/2021/TT-BKHĐT.",
      executionSteps:
        "Bước 1: Cá nhân/đại diện hộ gia đình nộp Giấy đề nghị đăng ký hộ kinh doanh.\nBước 2: Kiểm tra ngành nghề kinh doanh không thuộc danh mục cấm và tên hộ kinh doanh đúng quy chuẩn.\nBước 3: Trình phê duyệt cấp Giấy chứng nhận đăng ký hộ kinh doanh và liên thông mã số thuế.\nBước 4: Thu lệ phí 100.000 đồng và trả kết quả.",
      requiredDocsJson: JSON.stringify([
        { code: "GDN-HKD", name: "Giấy đề nghị đăng ký hộ kinh doanh (Phụ lục III-1)", mandatory: true },
        { code: "CCCD-CHU", name: "Bản sao Căn cước công dân của chủ hộ kinh doanh", mandatory: true },
        { code: "HD-THUE", name: "Bản sao hợp đồng thuê nhà / giấy tờ quyền sử dụng địa điểm kinh doanh", mandatory: true },
      ]),
      resultTemplate: "Giấy chứng nhận đăng ký hộ kinh doanh",
      departmentId: deptKinhTe.id,
    },
  });

  // 5. Tạo 10 Hồ sơ Một cửa phản ánh đầy đủ mọi tình huống nghiệp vụ thực tế (quanh mốc 2026-11-11)
  // HS 1: MOI_NOP (vừa nộp sáng 11/11/2026)
  await prisma.dossier.create({
    data: {
      dossierCode: "HS-20261111-0001",
      trackingPin: "482910",
      procedureId: procHonNhan.id,
      departmentId: deptTuPhap.id,
      applicantId: userCongDan1.id,
      applicantName: userCongDan1.fullName,
      applicantCitizenId: userCongDan1.citizenId!,
      applicantPhone: userCongDan1.phone,
      applicantEmail: userCongDan1.email,
      applicantAddress: userCongDan1.address!,
      applicantBirthYear: 1992,
      channel: "TRUC_TUYEN",
      status: "MOI_NOP",
      summary: "Đề nghị cấp Giấy xác nhận tình trạng hôn nhân để bổ túc hồ sơ vay vốn tín dụng ngân hàng mua nhà ở.",
      copiesCount: 2,
      feeAmount: 20000,
      feeExempt: false,
      feeStatus: "CHUA_THU_PHI",
      submittedAt: new Date("2026-11-11T06:05:00+07:00"),
      attachments: {
        create: [
          { docCode: "TK-TTHN", docName: "Tờ khai cấp Giấy xác nhận tình trạng hôn nhân", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "ToKhai_TTHN_HoangMinhTuan.pdf", isVerified: false },
          { docCode: "CCCD-CD", docName: "Bản chụp Căn cước công dân còn hiệu lực", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "CCCD_079092004518.pdf", isVerified: false },
        ],
      },
      histories: {
        create: [
          {
            fromStatus: null,
            toStatus: "MOI_NOP",
            actionName: "Nộp hồ sơ trực tuyến",
            actorId: userCongDan1.id,
            actorName: userCongDan1.fullName,
            actorRole: "CONG_DAN",
            note: "Công dân gửi hồ sơ trực tuyến qua Cổng Dịch vụ Hành chính công.",
            createdAt: new Date("2026-11-11T06:05:00+07:00"),
          },
        ],
      },
    },
  });

  // HS 2: DA_TIEP_NHAN (đã tiếp nhận chiều 10/11/2026, hẹn trả 13/11/2026)
  const accepted2 = new Date("2026-11-10T14:20:00+07:00");
  const due2 = calculateDueDate(accepted2, procKetHon.processingDays, procKetHon.processingHours, holidayDateStrings);
  await prisma.dossier.create({
    data: {
      dossierCode: "HS-20261110-0002",
      trackingPin: "619304",
      procedureId: procKetHon.id,
      departmentId: deptTuPhap.id,
      applicantId: userCongDan2.id,
      applicantName: userCongDan2.fullName,
      applicantCitizenId: userCongDan2.citizenId!,
      applicantPhone: userCongDan2.phone,
      applicantEmail: userCongDan2.email,
      applicantAddress: userCongDan2.address!,
      applicantBirthYear: 1995,
      channel: "TRUC_TIEP",
      status: "DA_TIEP_NHAN",
      summary: "Đăng ký kết hôn giữa bà Nguyễn Thị Bích Ngọc và ông Lê Quang Khải thường trú tại Tổ dân phố số 6.",
      copiesCount: 2,
      feeAmount: 0,
      feeExempt: true,
      feeExemptReason: "Miễn lệ phí đăng ký kết hôn trong nước theo Luật Hộ tịch",
      feeStatus: "MIEN_PHI",
      submittedAt: new Date("2026-11-10T14:00:00+07:00"),
      acceptedAt: accepted2,
      dueAt: due2,
      receiverId: userMotCua.id,
      assigneeId: userCvTuPhap.id,
      attachments: {
        create: [
          { docCode: "TK-KH", docName: "Tờ khai đăng ký kết hôn có chữ ký của hai bên nam, nữ", isMandatory: true, submittedType: "BAN_CHINH", fileName: "ToKhai_KetHon_Ngoc_Khai.pdf", isVerified: true },
          { docCode: "GXN-HN", docName: "Giấy xác nhận tình trạng hôn nhân của hai bên nam, nữ", isMandatory: true, submittedType: "BAN_CHINH", fileName: "GXN_DocThan_LeQuangKhai.pdf", isVerified: true },
          { docCode: "CCCD-2B", docName: "Căn cước công dân của hai bên nam, nữ", isMandatory: true, submittedType: "BAN_SAO_CHUNG_THUC", fileName: "CCCD_HaiBen.pdf", isVerified: true },
        ],
      },
      histories: {
        create: [
          {
            fromStatus: null,
            toStatus: "MOI_NOP",
            actionName: "Đăng ký hồ sơ tại quầy Một cửa",
            actorId: userCongDan2.id,
            actorName: userCongDan2.fullName,
            actorRole: "CONG_DAN",
            note: "Nộp trực tiếp tại Quầy số 01.",
            createdAt: new Date("2026-11-10T14:00:00+07:00"),
          },
          {
            fromStatus: "MOI_NOP",
            toStatus: "DA_TIEP_NHAN",
            actionName: "Tiếp nhận & Cấp giấy hẹn (Mẫu 01)",
            actorId: userMotCua.id,
            actorName: userMotCua.fullName,
            actorRole: "MOT_CUA",
            note: "Thành phần hồ sơ đầy đủ, hợp lệ. Đã xuất Giấy tiếp nhận và hẹn trả kết quả, chuyển Công chức Tư pháp thụ lý.",
            createdAt: accepted2,
          },
        ],
      },
    },
  });

  // HS 3: DANG_THAM_DINH (Địa chính đang thẩm định, trong hạn 16/11/2026)
  const accepted3 = new Date("2026-11-09T09:15:00+07:00");
  const due3 = calculateDueDate(accepted3, procDatDai.processingDays, procDatDai.processingHours, holidayDateStrings);
  await prisma.dossier.create({
    data: {
      dossierCode: "HS-20261109-0003",
      trackingPin: "730512",
      procedureId: procDatDai.id,
      departmentId: deptDiaChinh.id,
      applicantId: userCongDan1.id,
      applicantName: userCongDan1.fullName,
      applicantCitizenId: userCongDan1.citizenId!,
      applicantPhone: userCongDan1.phone,
      applicantEmail: userCongDan1.email,
      applicantAddress: userCongDan1.address!,
      applicantBirthYear: 1992,
      channel: "TRUC_TIEP",
      status: "DANG_THAM_DINH",
      summary: "Đề nghị xác nhận nguồn gốc và hiện trạng sử dụng ổn định không tranh chấp đối với thửa đất số 84, tờ bản đồ số 12.",
      copiesCount: 2,
      feeAmount: 50000,
      feeExempt: false,
      feeStatus: "DA_THU_PHI",
      paymentMethod: "TIEN_MAT",
      receiptNumber: "BL-2026-0048",
      paidAt: new Date("2026-11-09T09:25:00+07:00"),
      submittedAt: new Date("2026-11-09T09:00:00+07:00"),
      acceptedAt: accepted3,
      dueAt: due3,
      receiverId: userMotCua.id,
      assigneeId: userCvDiaChinh.id,
      attachments: {
        create: [
          { docCode: "DON-DD01", docName: "Đơn đề nghị xác nhận nguồn gốc và hiện trạng sử dụng đất", isMandatory: true, submittedType: "BAN_CHINH", fileName: "DonXacNhan_Thua84_TBD12.pdf", isVerified: true },
          { docCode: "GCN-SDD", docName: "Giấy tờ chứng minh quyền sử dụng đất hoặc trích đo địa chính thửa đất", isMandatory: true, submittedType: "BAN_SAO_CHUNG_THUC", fileName: "TrichDo_Thua84.pdf", isVerified: true },
          { docCode: "CCCD-SDD", docName: "Căn cước công dân của người sử dụng đất", isMandatory: true, submittedType: "BAN_SAO_CHUNG_THUC", fileName: "CCCD_HoangMinhTuan.pdf", isVerified: true },
        ],
      },
      histories: {
        create: [
          {
            fromStatus: null,
            toStatus: "MOI_NOP",
            actionName: "Nộp hồ sơ tại Bộ phận Một cửa",
            actorId: userCongDan1.id,
            actorName: userCongDan1.fullName,
            actorRole: "CONG_DAN",
            note: "Nộp hồ sơ địa chính thửa đất 84.",
            createdAt: new Date("2026-11-09T09:00:00+07:00"),
          },
          {
            fromStatus: "MOI_NOP",
            toStatus: "DA_TIEP_NHAN",
            actionName: "Tiếp nhận & Cấp giấy hẹn (Mẫu 01)",
            actorId: userMotCua.id,
            actorName: userMotCua.fullName,
            actorRole: "MOT_CUA",
            note: "Đã tiếp nhận và thu lệ phí thẩm định 50.000 đồng theo biên lai BL-2026-0048.",
            createdAt: accepted3,
          },
          {
            fromStatus: "DA_TIEP_NHAN",
            toStatus: "DANG_THAM_DINH",
            actionName: "Thụ lý & Thẩm định chuyên môn",
            actorId: userCvDiaChinh.id,
            actorName: userCvDiaChinh.fullName,
            actorRole: "CHUYEN_VIEN",
            note: "Đang đối chiếu sổ mục kê và kiểm tra ranh giới sử dụng đất thực tế với các hộ giáp ranh.",
            createdAt: new Date("2026-11-09T14:00:00+07:00"),
          },
        ],
      },
    },
  });

  // HS 4: YEU_CAU_BO_SUNG (Tạm dừng đồng hồ SLA chờ công dân nộp bổ sung Hợp đồng thuê mặt bằng)
  const accepted4 = new Date("2026-11-09T10:00:00+07:00");
  const due4 = calculateDueDate(accepted4, procHoKinhDoanh.processingDays, procHoKinhDoanh.processingHours, holidayDateStrings);
  await prisma.dossier.create({
    data: {
      dossierCode: "HS-20261109-0004",
      trackingPin: "845129",
      procedureId: procHoKinhDoanh.id,
      departmentId: deptKinhTe.id,
      applicantId: userCongDan1.id,
      applicantName: userCongDan1.fullName,
      applicantCitizenId: userCongDan1.citizenId!,
      applicantPhone: userCongDan1.phone,
      applicantEmail: userCongDan1.email,
      applicantAddress: userCongDan1.address!,
      applicantBirthYear: 1992,
      channel: "TRUC_TUYEN",
      status: "YEU_CAU_BO_SUNG",
      summary: "Đăng ký thành lập Hộ kinh doanh Cửa hàng Thực phẩm Sạch Minh Tuấn tại số 42 Phố Thanh Nhàn.",
      copiesCount: 1,
      feeAmount: 100000,
      feeExempt: false,
      feeStatus: "CHUA_THU_PHI",
      submittedAt: new Date("2026-11-09T09:40:00+07:00"),
      acceptedAt: accepted4,
      dueAt: due4,
      slaPausedAt: new Date("2026-11-10T09:00:00+07:00"),
      supplementCount: 1,
      supplementReason:
        "Bản chụp Hợp đồng thuê địa điểm kinh doanh bị thiếu trang cuối có chữ ký xác nhận của bên cho thuê và chưa kê khai mã ngành nghề kinh doanh chi tiết (mã VSIC 4721). Đề nghị công dân bổ sung bản quét đầy đủ.",
      supplementDeadline: new Date("2026-11-17T17:00:00+07:00"),
      receiverId: userMotCua.id,
      assigneeId: userCvKinhTe.id,
      attachments: {
        create: [
          { docCode: "GDN-HKD", docName: "Giấy đề nghị đăng ký hộ kinh doanh (Phụ lục III-1)", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "GiayDeNghi_HKD_MinhTuan.pdf", isVerified: true },
          { docCode: "CCCD-CHU", docName: "Bản sao Căn cước công dân của chủ hộ kinh doanh", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "CCCD_ChuHo.pdf", isVerified: true },
          { docCode: "HD-THUE", docName: "Bản sao hợp đồng thuê nhà / giấy tờ quyền sử dụng địa điểm kinh doanh", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "HopDongThue_ThieuTrangCuoi.pdf", isVerified: false, verifyNote: "Thiếu trang chữ ký bên cho thuê" },
        ],
      },
      histories: {
        create: [
          {
            fromStatus: null,
            toStatus: "MOI_NOP",
            actionName: "Nộp hồ sơ trực tuyến",
            actorId: userCongDan1.id,
            actorName: userCongDan1.fullName,
            actorRole: "CONG_DAN",
            note: "Gửi hồ sơ đăng ký hộ kinh doanh trực tuyến.",
            createdAt: new Date("2026-11-09T09:40:00+07:00"),
          },
          {
            fromStatus: "MOI_NOP",
            toStatus: "DA_TIEP_NHAN",
            actionName: "Tiếp nhận & Cấp giấy hẹn (Mẫu 01)",
            actorId: userMotCua.id,
            actorName: userMotCua.fullName,
            actorRole: "MOT_CUA",
            note: "Tiếp nhận chuyển Bộ phận Kinh tế - Tài chính thẩm định.",
            createdAt: accepted4,
          },
          {
            fromStatus: "DA_TIEP_NHAN",
            toStatus: "YEU_CAU_BO_SUNG",
            actionName: "Yêu cầu bổ sung hồ sơ (Mẫu 02)",
            actorId: userCvKinhTe.id,
            actorName: userCvKinhTe.fullName,
            actorRole: "CHUYEN_VIEN",
            note: "Ban hành Phiếu yêu cầu bổ sung hoàn thiện hồ sơ (Mẫu 02). Tạm dừng tính thời gian giải quyết chờ công dân bổ sung.",
            createdAt: new Date("2026-11-10T09:00:00+07:00"),
          },
        ],
      },
    },
  });

  // HS 5: CHO_PHE_DUYET (Sắp đến hạn chiều nay 11/11/2026 17:00 - chờ Lãnh đạo ký duyệt!)
  const accepted5 = new Date("2026-11-10T10:15:00+07:00");
  const due5 = calculateDueDate(accepted5, procKhaiSinh.processingDays, procKhaiSinh.processingHours, holidayDateStrings);
  await prisma.dossier.create({
    data: {
      dossierCode: "HS-20261110-0005",
      trackingPin: "391042",
      procedureId: procKhaiSinh.id,
      departmentId: deptTuPhap.id,
      applicantId: userCongDan2.id,
      applicantName: userCongDan2.fullName,
      applicantCitizenId: userCongDan2.citizenId!,
      applicantPhone: userCongDan2.phone,
      applicantEmail: userCongDan2.email,
      applicantAddress: userCongDan2.address!,
      applicantBirthYear: 1995,
      channel: "TRUC_TUYEN",
      status: "CHO_PHE_DUYET",
      summary: "Đăng ký khai sinh cho trẻ Hoàng Gia Bảo, sinh ngày 02/11/2026 tại Bệnh viện Phụ sản Mỹ Đức.",
      copiesCount: 3,
      feeAmount: 0,
      feeExempt: true,
      feeExemptReason: "Miễn lệ phí đăng ký khai sinh đúng hạn",
      feeStatus: "MIEN_PHI",
      submittedAt: new Date("2026-11-10T09:50:00+07:00"),
      acceptedAt: accepted5,
      dueAt: due5,
      receiverId: userMotCua.id,
      assigneeId: userCvTuPhap.id,
      appraisalNote:
        "Đã kiểm tra tính xác thực Giấy chứng sinh số 1842/GCS-BVMD và đối chiếu thông tin CSDL Quốc gia về dân cư của cha mẹ. Đủ điều kiện pháp lý cấp Giấy khai sinh và số định danh cá nhân cho trẻ. Kính trình Chủ tịch UBND ký duyệt.",
      attachments: {
        create: [
          { docCode: "TK-KS-01", docName: "Tờ khai đăng ký khai sinh theo mẫu quy định", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "ToKhai_KhaiSinh_HoangGiaBao.pdf", isVerified: true },
          { docCode: "GCS-BV", docName: "Giấy chứng sinh do cơ sở y tế cấp", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "GiayChungSinh_1842.pdf", isVerified: true },
          { docCode: "GCN-KH", docName: "Giấy chứng nhận kết hôn của cha mẹ", isMandatory: false, submittedType: "BAN_DIEN_TU", fileName: "GCNKetHon_ChaMe.pdf", isVerified: true },
        ],
      },
      histories: {
        create: [
          {
            fromStatus: null,
            toStatus: "MOI_NOP",
            actionName: "Nộp hồ sơ trực tuyến",
            actorId: userCongDan2.id,
            actorName: userCongDan2.fullName,
            actorRole: "CONG_DAN",
            note: "Gửi hồ sơ khai sinh liên thông trực tuyến.",
            createdAt: new Date("2026-11-10T09:50:00+07:00"),
          },
          {
            fromStatus: "MOI_NOP",
            toStatus: "DA_TIEP_NHAN",
            actionName: "Tiếp nhận & Cấp giấy hẹn (Mẫu 01)",
            actorId: userMotCua.id,
            actorName: userMotCua.fullName,
            actorRole: "MOT_CUA",
            note: "Hồ sơ đầy đủ, hẹn trả 17:00 ngày 11/11/2026.",
            createdAt: accepted5,
          },
          {
            fromStatus: "DA_TIEP_NHAN",
            toStatus: "DANG_THAM_DINH",
            actionName: "Thụ lý & Thẩm định chuyên môn",
            actorId: userCvTuPhap.id,
            actorName: userCvTuPhap.fullName,
            actorRole: "CHUYEN_VIEN",
            note: "Đối chiếu dữ liệu hộ tịch và cấp mã định danh.",
            createdAt: new Date("2026-11-10T15:00:00+07:00"),
          },
          {
            fromStatus: "DANG_THAM_DINH",
            toStatus: "CHO_PHE_DUYET",
            actionName: "Hoàn tất thẩm định & Trình Lãnh đạo ký",
            actorId: userCvTuPhap.id,
            actorName: userCvTuPhap.fullName,
            actorRole: "CHUYEN_VIEN",
            note: "Đã lập dự thảo Giấy khai sinh, trình Chủ tịch UBND ký duyệt.",
            createdAt: new Date("2026-11-11T05:30:00+07:00"),
          },
        ],
      },
    },
  });

  // HS 6: CHO_TRA_KET_QUA nhưng CHƯA THU LỆ PHÍ (20.000đ) -> Một cửa bắt buộc thu phí trước khi trả kết quả!
  const accepted6 = new Date("2026-11-06T09:00:00+07:00");
  const due6 = calculateDueDate(accepted6, procHonNhan.processingDays, procHonNhan.processingHours, holidayDateStrings);
  const d6 = await prisma.dossier.create({
    data: {
      dossierCode: "HS-20261106-0006",
      trackingPin: "528173",
      procedureId: procHonNhan.id,
      departmentId: deptTuPhap.id,
      applicantId: userCongDan2.id,
      applicantName: userCongDan2.fullName,
      applicantCitizenId: userCongDan2.citizenId!,
      applicantPhone: userCongDan2.phone,
      applicantEmail: userCongDan2.email,
      applicantAddress: userCongDan2.address!,
      applicantBirthYear: 1995,
      channel: "TRUC_TUYEN",
      status: "CHO_TRA_KET_QUA",
      summary: "Đề nghị cấp Giấy xác nhận tình trạng hôn nhân phục vụ thủ tục chuyển nhượng tài sản cá nhân.",
      copiesCount: 1,
      feeAmount: 20000,
      feeExempt: false,
      feeStatus: "CHUA_THU_PHI",
      submittedAt: new Date("2026-11-06T08:30:00+07:00"),
      acceptedAt: accepted6,
      dueAt: due6,
      receiverId: userMotCua.id,
      assigneeId: userCvTuPhap.id,
      approverId: userLanhDao.id,
      appraisalNote: "Qua tra cứu Sổ hộ tịch giai đoạn 2013-2026, bà Nguyễn Thị Bích Ngọc chưa đăng ký kết hôn với ai.",
      leaderNote: "Đồng ý phê duyệt, giao Bộ phận Một cửa thu lệ phí hộ tịch đầy đủ trước khi trả kết quả.",
      resultDocNumber: "312/GXN-UBND",
      resultSummary: "Giấy xác nhận tình trạng hôn nhân số 312/GXN-UBND cấp cho bà Nguyễn Thị Bích Ngọc.",
      isDigitizedResult: true,
      electronicResultCode: "KQDT-2026-0312",
      signedAt: new Date("2026-11-10T16:10:00+07:00"),
      attachments: {
        create: [
          { docCode: "TK-TTHN", docName: "Tờ khai cấp Giấy xác nhận tình trạng hôn nhân", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "ToKhai_TTHN_BichNgoc.pdf", isVerified: true },
          { docCode: "CCCD-CD", docName: "Bản chụp Căn cước công dân còn hiệu lực", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "CCCD_BichNgoc.pdf", isVerified: true, reusedFromVault: true },
        ],
      },
      histories: {
        create: [
          {
            fromStatus: null,
            toStatus: "MOI_NOP",
            actionName: "Nộp hồ sơ trực tuyến",
            actorId: userCongDan2.id,
            actorName: userCongDan2.fullName,
            actorRole: "CONG_DAN",
            note: "Công dân gửi hồ sơ trực tuyến.",
            createdAt: new Date("2026-11-06T08:30:00+07:00"),
          },
          {
            fromStatus: "MOI_NOP",
            toStatus: "DA_TIEP_NHAN",
            actionName: "Tiếp nhận & Cấp giấy hẹn (Mẫu 01)",
            actorId: userMotCua.id,
            actorName: userMotCua.fullName,
            actorRole: "MOT_CUA",
            note: "Tiếp nhận hồ sơ hợp lệ.",
            createdAt: accepted6,
          },
          {
            fromStatus: "DA_TIEP_NHAN",
            toStatus: "DANG_THAM_DINH",
            actionName: "Thụ lý & Thẩm định chuyên môn",
            actorId: userCvTuPhap.id,
            actorName: userCvTuPhap.fullName,
            actorRole: "CHUYEN_VIEN",
            note: "Xác minh sổ bộ hộ tịch.",
            createdAt: new Date("2026-11-09T08:30:00+07:00"),
          },
          {
            fromStatus: "DANG_THAM_DINH",
            toStatus: "CHO_PHE_DUYET",
            actionName: "Hoàn tất thẩm định & Trình Lãnh đạo ký",
            actorId: userCvTuPhap.id,
            actorName: userCvTuPhap.fullName,
            actorRole: "CHUYEN_VIEN",
            note: "Trình Lãnh đạo ký Giấy xác nhận số 312/GXN-UBND.",
            createdAt: new Date("2026-11-10T10:30:00+07:00"),
          },
          {
            fromStatus: "CHO_PHE_DUYET",
            toStatus: "CHO_TRA_KET_QUA",
            actionName: "Ký duyệt & Ban hành kết quả",
            actorId: userLanhDao.id,
            actorName: userLanhDao.fullName,
            actorRole: "LANH_DAO",
            note: "Đã ký ban hành số 312/GXN-UBND. Chờ thu lệ phí 20.000 đồng và trả kết quả.",
            createdAt: new Date("2026-11-10T16:10:00+07:00"),
          },
        ],
      },
    },
  });

  // HS 7: HOAN_THANH trước hạn + đã thu phí + đánh giá RẤT HÀI LÒNG
  const accepted7 = new Date("2026-10-28T08:30:00+07:00");
  const due7 = calculateDueDate(accepted7, procXayDung.processingDays, procXayDung.processingHours, holidayDateStrings);
  const d7 = await prisma.dossier.create({
    data: {
      dossierCode: "HS-20261028-0007",
      trackingPin: "904215",
      procedureId: procXayDung.id,
      departmentId: deptDiaChinh.id,
      applicantId: userCongDan1.id,
      applicantName: userCongDan1.fullName,
      applicantCitizenId: userCongDan1.citizenId!,
      applicantPhone: userCongDan1.phone,
      applicantEmail: userCongDan1.email,
      applicantAddress: userCongDan1.address!,
      applicantBirthYear: 1992,
      channel: "TRUC_TUYEN",
      status: "HOAN_THANH",
      summary: "Đề nghị cấp Giấy phép xây dựng nhà ở riêng lẻ quy mô 01 trệt, 02 lầu tại số 42 Phố Thanh Nhàn.",
      copiesCount: 2,
      feeAmount: 75000,
      feeExempt: false,
      feeStatus: "DA_THU_PHI",
      paymentMethod: "TRUC_TUYEN",
      receiptNumber: "BL-2026-0041",
      paidAt: new Date("2026-11-06T09:10:00+07:00"),
      submittedAt: new Date("2026-10-28T08:05:00+07:00"),
      acceptedAt: accepted7,
      dueAt: due7,
      completedAt: new Date("2026-11-06T15:30:00+07:00"),
      receiverId: userMotCua.id,
      assigneeId: userCvDiaChinh.id,
      approverId: userLanhDao.id,
      appraisalNote: "Thiết kế phù hợp quy hoạch phân khu 1/2000, mật độ xây dựng 78%, lùi sau 2m đúng quy chuẩn.",
      leaderNote: "Chấp thuận cấp phép xây dựng trước hạn 03 ngày làm việc.",
      resultDocNumber: "89/GPXD-UBND",
      resultSummary: "Giấy phép xây dựng nhà ở riêng lẻ số 89/GPXD-UBND (03 tầng, tổng diện tích sàn 216 m2).",
      isDigitizedResult: true,
      electronicResultCode: "KQDT-2026-0089",
      signedAt: new Date("2026-11-06T11:00:00+07:00"),
      satisfactionRating: "RAT_HAI_LONG",
      satisfactionComment: "Cán bộ hướng dẫn tận tình, giải quyết hồ sơ xây dựng sớm hơn giấy hẹn 3 ngày.",
      ratedAt: new Date("2026-11-06T16:45:00+07:00"),
      attachments: {
        create: [
          { docCode: "DON-GPXD", docName: "Đơn đề nghị cấp giấy phép xây dựng nhà ở riêng lẻ", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "DonGPXD_42CongHoa.pdf", isVerified: true },
          { docCode: "QSDD-BS", docName: "Bản sao chứng thực Giấy chứng nhận quyền sử dụng đất", isMandatory: true, submittedType: "BAN_SAO_CHUNG_THUC", fileName: "GCN_QSDD_CS49201.pdf", isVerified: true, reusedFromVault: true },
          { docCode: "BV-TKXD", docName: "Bộ bản vẽ thiết kế xây dựng", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "BanVeKienTruc_KetCau.pdf", isVerified: true },
        ],
      },
      histories: {
        create: [
          {
            fromStatus: null,
            toStatus: "MOI_NOP",
            actionName: "Nộp hồ sơ trực tuyến",
            actorId: userCongDan1.id,
            actorName: userCongDan1.fullName,
            actorRole: "CONG_DAN",
            note: "Nộp hồ sơ cấp phép xây dựng trực tuyến.",
            createdAt: new Date("2026-10-28T08:05:00+07:00"),
          },
          {
            fromStatus: "MOI_NOP",
            toStatus: "DA_TIEP_NHAN",
            actionName: "Tiếp nhận & Cấp giấy hẹn (Mẫu 01)",
            actorId: userMotCua.id,
            actorName: userMotCua.fullName,
            actorRole: "MOT_CUA",
            note: "Tiếp nhận hồ sơ hợp lệ.",
            createdAt: accepted7,
          },
          {
            fromStatus: "DA_TIEP_NHAN",
            toStatus: "CHO_TRA_KET_QUA",
            actionName: "Ký duyệt & Ban hành kết quả",
            actorId: userLanhDao.id,
            actorName: userLanhDao.fullName,
            actorRole: "LANH_DAO",
            note: "Ký ban hành Giấy phép xây dựng số 89/GPXD-UBND.",
            createdAt: new Date("2026-11-06T11:00:00+07:00"),
          },
          {
            fromStatus: "CHO_TRA_KET_QUA",
            toStatus: "HOAN_THANH",
            actionName: "Trả kết quả giải quyết cho Công dân",
            actorId: userMotCua.id,
            actorName: userMotCua.fullName,
            actorRole: "MOT_CUA",
            note: "Đã thu lệ phí BL-2026-0041 và bàn giao kết quả trước hạn.",
            createdAt: new Date("2026-11-06T15:30:00+07:00"),
          },
        ],
      },
    },
  });

  // HS 8: HOAN_THANH đúng hạn (An sinh xã hội - có ủy quyền nộp hồ sơ!)
  const accepted8 = new Date("2026-11-02T09:00:00+07:00");
  const due8 = calculateDueDate(accepted8, procTroCap.processingDays, procTroCap.processingHours, holidayDateStrings);
  const d8 = await prisma.dossier.create({
    data: {
      dossierCode: "HS-20261102-0008",
      trackingPin: "217650",
      procedureId: procTroCap.id,
      departmentId: deptVanHoa.id,
      applicantName: "Cụ bà Lê Thị Mười",
      applicantCitizenId: "079145000319",
      applicantPhone: "0909332211",
      applicantAddress: "Số 19 Ngõ 8 Phố Võ Thị Sáu, Tổ dân phố số 1, Phường Thanh Nhàn",
      applicantBirthYear: 1945,
      representativeName: "Trần Thanh Tùng",
      representativeCitizenId: "079075004812",
      authorizationNote: "Giấy ủy quyền chứng thực số 112/GUQ ngày 01/11/2026 (con ruột nộp thay mẹ già 81 tuổi)",
      channel: "TRUC_TIEP",
      status: "HOAN_THANH",
      summary: "Đề nghị hưởng trợ cấp xã hội hàng tháng đối với người cao tuổi từ đủ 80 tuổi trở lên không có lương hưu.",
      copiesCount: 1,
      feeAmount: 0,
      feeExempt: true,
      feeExemptReason: "Thủ tục bảo trợ xã hội miễn phí",
      feeStatus: "MIEN_PHI",
      submittedAt: new Date("2026-11-02T08:45:00+07:00"),
      acceptedAt: accepted8,
      dueAt: due8,
      completedAt: new Date("2026-11-09T10:30:00+07:00"),
      receiverId: userMotCua.id,
      assigneeId: userCvVanHoa.id,
      approverId: userLanhDao.id,
      appraisalNote: "Đã rà soát dữ liệu BHXH không hưởng lương hưu, đủ 81 tuổi, đủ điều kiện hưởng trợ cấp hàng tháng.",
      leaderNote: "Đồng ý ký Quyết định trợ cấp xã hội hàng tháng.",
      resultDocNumber: "405/QĐ-UBND",
      resultSummary: "Quyết định số 405/QĐ-UBND về việc hưởng trợ cấp xã hội hàng tháng cho cụ Lê Thị Mười.",
      isDigitizedResult: true,
      electronicResultCode: "KQDT-2026-0405",
      signedAt: new Date("2026-11-09T09:00:00+07:00"),
      satisfactionRating: "RAT_HAI_LONG",
      satisfactionComment: "Giải quyết chu đáo cho người cao tuổi, thủ tục ủy quyền rõ ràng.",
      ratedAt: new Date("2026-11-09T11:15:00+07:00"),
      attachments: {
        create: [
          { docCode: "TK-BTXH", docName: "Tờ khai đề nghị trợ giúp xã hội (Mẫu số 01)", isMandatory: true, submittedType: "BAN_CHINH", fileName: "ToKhai_BTXH_CuLeThiMuoi.pdf", isVerified: true },
          { docCode: "CCCD-NCT", docName: "Bản chụp Căn cước công dân của người cao tuổi", isMandatory: true, submittedType: "BAN_SAO_CHUNG_THUC", fileName: "CCCD_CuLeThiMuoi.pdf", isVerified: true },
        ],
      },
      histories: {
        create: [
          {
            fromStatus: null,
            toStatus: "MOI_NOP",
            actionName: "Tiếp nhận hồ sơ ủy quyền tại quầy",
            actorId: userMotCua.id,
            actorName: userMotCua.fullName,
            actorRole: "MOT_CUA",
            note: "Ông Trần Thanh Tùng nộp thay theo Giấy ủy quyền 112/GUQ.",
            createdAt: new Date("2026-11-02T08:45:00+07:00"),
          },
          {
            fromStatus: "MOI_NOP",
            toStatus: "HOAN_THANH",
            actionName: "Hoàn tất giải quyết & Trả kết quả đúng hạn",
            actorId: userMotCua.id,
            actorName: userMotCua.fullName,
            actorRole: "MOT_CUA",
            note: "Bàn giao Quyết định số 405/QĐ-UBND đúng hạn.",
            createdAt: new Date("2026-11-09T10:30:00+07:00"),
          },
        ],
      },
    },
  });

  // HS 9: DANG_THAM_DINH nhưng QUÁ HẠN SLA (dueAt: 10/11/2026 17:00 -> hiện tại 11/11/2026 đang cảnh báo Đỏ Quá hạn!)
  const accepted9 = new Date("2026-11-03T10:00:00+07:00");
  const due9 = calculateDueDate(accepted9, procDatDai.processingDays, procDatDai.processingHours, holidayDateStrings);
  await prisma.dossier.create({
    data: {
      dossierCode: "HS-20261103-0009",
      trackingPin: "673820",
      procedureId: procDatDai.id,
      departmentId: deptDiaChinh.id,
      applicantName: "Đỗ Văn Hùng",
      applicantCitizenId: "079081006429",
      applicantPhone: "0913778899",
      applicantAddress: "Số 75 Phố Trần Khát Chân, Tổ dân phố số 4, Phường Thanh Nhàn",
      applicantBirthYear: 1981,
      channel: "TRUC_TIEP",
      status: "DANG_THAM_DINH",
      summary: "Xác nhận nguồn gốc sử dụng đất trước năm 1993 đối với thửa đất số 19, tờ bản đồ số 05 (hồ sơ cần trích lục bản đồ cũ).",
      copiesCount: 2,
      feeAmount: 50000,
      feeExempt: false,
      feeStatus: "DA_THU_PHI",
      paymentMethod: "TIEN_MAT",
      receiptNumber: "BL-2026-0039",
      paidAt: new Date("2026-11-03T10:15:00+07:00"),
      submittedAt: new Date("2026-11-03T09:45:00+07:00"),
      acceptedAt: accepted9,
      dueAt: due9,
      receiverId: userMotCua.id,
      assigneeId: userCvDiaChinh.id,
      attachments: {
        create: [
          { docCode: "DON-DD01", docName: "Đơn đề nghị xác nhận nguồn gốc và hiện trạng sử dụng đất", isMandatory: true, submittedType: "BAN_CHINH", fileName: "DonXacNhan_Thua19.pdf", isVerified: true },
          { docCode: "GCN-SDD", docName: "Giấy tờ mua bán viết tay năm 1991 và bản trích đo", isMandatory: true, submittedType: "BAN_SAO_CHUNG_THUC", fileName: "GiayTo1991_Thua19.pdf", isVerified: true },
          { docCode: "CCCD-SDD", docName: "Căn cước công dân của người sử dụng đất", isMandatory: true, submittedType: "BAN_SAO_CHUNG_THUC", fileName: "CCCD_DoVanHung.pdf", isVerified: true },
        ],
      },
      histories: {
        create: [
          {
            fromStatus: null,
            toStatus: "DA_TIEP_NHAN",
            actionName: "Tiếp nhận & Cấp giấy hẹn (Mẫu 01)",
            actorId: userMotCua.id,
            actorName: userMotCua.fullName,
            actorRole: "MOT_CUA",
            note: "Tiếp nhận hồ sơ, hẹn trả 17:00 ngày 10/11/2026.",
            createdAt: accepted9,
          },
          {
            fromStatus: "DA_TIEP_NHAN",
            toStatus: "DANG_THAM_DINH",
            actionName: "Thụ lý & Thẩm định chuyên môn",
            actorId: userCvDiaChinh.id,
            actorName: userCvDiaChinh.fullName,
            actorRole: "CHUYEN_VIEN",
            note: "Đang chờ kết quả phiếu lấy ý kiến khu dân cư về thời điểm bắt đầu sử dụng đất ổn định (cần lập Phiếu xin lỗi & gia hạn Mẫu 04).",
            createdAt: new Date("2026-11-04T09:00:00+07:00"),
          },
        ],
      },
    },
  });

  // HS 10: TU_CHOI_TIEP_NHAN (Mẫu 03 - không thuộc thẩm quyền địa giới hành chính)
  await prisma.dossier.create({
    data: {
      dossierCode: "HS-20261107-0010",
      trackingPin: "159843",
      procedureId: procDatDai.id,
      departmentId: deptDiaChinh.id,
      applicantName: "Phan Thanh Sơn",
      applicantCitizenId: "079086005120",
      applicantPhone: "0902665544",
      applicantAddress: "Số 14 Đường Lê Văn Sỹ, Phường lân cận",
      applicantBirthYear: 1986,
      channel: "TRUC_TUYEN",
      status: "TU_CHOI_TIEP_NHAN",
      summary: "Đề nghị xác nhận tình trạng tranh chấp đối với thửa đất tọa lạc ngoài ranh giới quản lý của Phường Thanh Nhàn.",
      copiesCount: 1,
      feeAmount: 50000,
      feeExempt: false,
      feeStatus: "CHUA_THU_PHI",
      submittedAt: new Date("2026-11-07T08:20:00+07:00"),
      receiverId: userMotCua.id,
      rejectionReason:
        "Thửa đất đề nghị xác nhận (Tờ bản đồ số 29, thửa 104) nằm ngoài địa giới hành chính quản lý của UBND Phường Thanh Nhàn. Hướng dẫn ông Phan Thanh Sơn nộp hồ sơ tại UBND phường nơi có đất tọa lạc.",
      rejectionLegalBasis: "Khoản 1 Điều 19 Nghị định số 61/2018/NĐ-CP và Luật Đất đai năm 2024 về thẩm quyền xác nhận theo địa giới hành chính nơi có đất.",
      attachments: {
        create: [
          { docCode: "DON-DD01", docName: "Đơn đề nghị xác nhận nguồn gốc đất", isMandatory: true, submittedType: "BAN_DIEN_TU", fileName: "DonDeNghi_NgoaiDiaGioi.pdf", isVerified: false },
        ],
      },
      histories: {
        create: [
          {
            fromStatus: null,
            toStatus: "MOI_NOP",
            actionName: "Nộp hồ sơ trực tuyến",
            actorName: "Phan Thanh Sơn",
            actorRole: "CONG_DAN",
            note: "Gửi hồ sơ qua cổng trực tuyến.",
            createdAt: new Date("2026-11-07T08:20:00+07:00"),
          },
          {
            fromStatus: "MOI_NOP",
            toStatus: "TU_CHOI_TIEP_NHAN",
            actionName: "Từ chối tiếp nhận (Mẫu 03)",
            actorId: userMotCua.id,
            actorName: userMotCua.fullName,
            actorRole: "MOT_CUA",
            note: "Đã ban hành Phiếu từ chối tiếp nhận giải quyết hồ sơ (Mẫu số 03) và hướng dẫn đúng cơ quan có thẩm quyền.",
            createdAt: new Date("2026-11-07T10:05:00+07:00"),
          },
        ],
      },
    },
  });

  // 6. Sổ Văn bản Đến & Văn bản Đi (Nghị định 30/2020/NĐ-CP)
  await prisma.officialDocument.createMany({
    data: [
      {
        direction: "DEN",
        incomingNumber: 418,
        documentSymbol: "2845/SNV-CCHC",
        docType: "CONG_VAN",
        urgency: "HOA_TOC",
        security: "THUONG",
        status: "CHO_BUT_PHE",
        title: "V/v chấn chỉnh kỷ cương hành chính và rà soát tỷ lệ giải quyết hồ sơ đúng hạn quý IV/2026",
        contentSummary:
          "Yêu cầu UBND các phường rà soát toàn bộ hồ sơ TTHC đang quá hạn, thực hiện nghiêm quy định gửi Phiếu xin lỗi công dân theo cơ chế Một cửa và báo cáo số liệu trước ngày 15/11/2026.",
        issuingAgency: "Sở Nội vụ Thành phố",
        recipientAgency: "UBND Phường Thanh Nhàn",
        signerName: "Lê Trọng Nghĩa",
        signerTitle: "Phó Giám đốc Sở Nội vụ",
        issuedDate: new Date("2026-11-10T09:00:00+07:00"),
        receivedDate: new Date("2026-11-11T06:10:00+07:00"),
        processingDeadline: new Date("2026-11-14T17:00:00+07:00"),
        createdById: userQuanTri.id,
      },
      {
        direction: "DEN",
        incomingNumber: 417,
        documentSymbol: "1902/STNMT-ĐĐ",
        docType: "THONG_BAO",
        urgency: "KHAN",
        security: "THUONG",
        status: "DANG_XU_LY",
        title: "Thông báo lịch kiểm tra công tác quản lý trật tự xây dựng và cấp phép xây dựng đô thị đợt 2/2026",
        contentSummary:
          "Đoàn kiểm tra liên ngành sẽ làm việc với Bộ phận Địa chính - Xây dựng về hồ sơ cấp phép nhà ở riêng lẻ và công tác hậu kiểm sau cấp phép.",
        issuingAgency: "Sở Tài nguyên và Môi trường",
        recipientAgency: "UBND Phường Thanh Nhàn",
        signerName: "Võ Thành Đạt",
        signerTitle: "Chánh Thanh tra Sở",
        issuedDate: new Date("2026-11-08T14:00:00+07:00"),
        receivedDate: new Date("2026-11-09T08:15:00+07:00"),
        processingDeadline: new Date("2026-11-16T17:00:00+07:00"),
        directiveNote: "Giao đ/c Vũ Đình Khôi (Bộ phận Địa chính - Xây dựng) chuẩn bị đầy đủ hồ sơ, danh mục GPXD năm 2026 để phục vụ Đoàn kiểm tra.",
        leadDepartmentId: deptDiaChinh.id,
        assigneeId: userCvDiaChinh.id,
        createdById: userQuanTri.id,
      },
      {
        direction: "DI",
        outgoingNumber: 101,
        documentSymbol: "89/GPXD-UBND",
        docType: "QUYET_DINH",
        urgency: "THUONG",
        security: "THUONG",
        status: "DA_BAN_HANH",
        title: "Giấy phép xây dựng nhà ở riêng lẻ số 89/GPXD-UBND cấp cho ông Hoàng Minh Tuấn",
        contentSummary: "Cấp phép xây dựng công trình nhà ở riêng lẻ 03 tầng tại số 42 Phố Thanh Nhàn theo hồ sơ Một cửa HS-20261028-0007.",
        issuingAgency: "UBND Phường Thanh Nhàn",
        recipientAgency: "Ông Hoàng Minh Tuấn; Đội Quản lý Trật tự Đô thị",
        signerName: userLanhDao.fullName,
        signerTitle: userLanhDao.positionTitle!,
        issuedDate: new Date("2026-11-06T11:00:00+07:00"),
        leadDepartmentId: deptDiaChinh.id,
        assigneeId: userCvDiaChinh.id,
        linkedDossierId: d7.id,
        createdById: userQuanTri.id,
      },
      {
        direction: "DI",
        outgoingNumber: 103,
        documentSymbol: "312/GXN-UBND",
        docType: "GIAY_XAC_NHAN",
        urgency: "THUONG",
        security: "THUONG",
        status: "DA_BAN_HANH",
        title: "Giấy xác nhận tình trạng hôn nhân số 312/GXN-UBND cấp cho bà Nguyễn Thị Bích Ngọc",
        contentSummary: "Xác nhận tình trạng độc thân phục vụ thủ tục dân sự theo hồ sơ Một cửa mã HS-20261106-0006.",
        issuingAgency: "UBND Phường Thanh Nhàn",
        recipientAgency: "Bà Nguyễn Thị Bích Ngọc",
        signerName: userLanhDao.fullName,
        signerTitle: userLanhDao.positionTitle!,
        issuedDate: new Date("2026-11-10T16:10:00+07:00"),
        leadDepartmentId: deptTuPhap.id,
        assigneeId: userCvTuPhap.id,
        linkedDossierId: d6.id,
        createdById: userLanhDao.id,
      },
      {
        direction: "DI",
        outgoingNumber: 102,
        documentSymbol: "405/QĐ-UBND",
        docType: "QUYET_DINH",
        urgency: "THUONG",
        security: "THUONG",
        status: "DA_BAN_HANH",
        title: "Quyết định số 405/QĐ-UBND về việc hưởng trợ cấp xã hội hàng tháng đối với người cao tuổi",
        contentSummary: "Phê duyệt trợ cấp xã hội hàng tháng cho cụ bà Lê Thị Mười (81 tuổi) theo hồ sơ Một cửa mã HS-20261102-0008.",
        issuingAgency: "UBND Phường Thanh Nhàn",
        recipientAgency: "Cụ bà Lê Thị Mười; Bộ phận Văn hóa - Xã hội",
        signerName: userLanhDao.fullName,
        signerTitle: userLanhDao.positionTitle!,
        issuedDate: new Date("2026-11-09T09:00:00+07:00"),
        leadDepartmentId: deptVanHoa.id,
        assigneeId: userCvVanHoa.id,
        linkedDossierId: d8.id,
        createdById: userLanhDao.id,
      },
      {
        direction: "DEN",
        incomingNumber: 419,
        documentSymbol: "95/BC-CATP-M",
        docType: "BAO_CAO",
        urgency: "THUONG_KHAN",
        security: "MAT",
        status: "DANG_XU_LY",
        title: "Báo cáo chuyên đề xác minh nhân thân, hộ tịch phục vụ công tác bảo vệ chính trị nội bộ",
        contentSummary:
          "Tài liệu độ MẬT theo Nghị định 30/2020/NĐ-CP và Luật Bảo vệ bí mật nhà nước, chỉ lưu hành tới Lãnh đạo UBND, Văn thư và Chuyên viên Tư pháp được phân công trực tiếp.",
        issuingAgency: "Công an Thành phố",
        recipientAgency: "Chủ tịch UBND Phường Thanh Nhàn",
        signerName: "Đại tá Nguyễn Hữu Kiên",
        signerTitle: "Phó Giám đốc Công an Thành phố",
        issuedDate: new Date("2026-11-10T15:00:00+07:00"),
        receivedDate: new Date("2026-11-10T16:30:00+07:00"),
        processingDeadline: new Date("2026-11-15T17:00:00+07:00"),
        directiveNote: "Giao đ/c Phạm Hoàng Nam (Tư pháp - Hộ tịch) tra cứu sổ gốc hộ tịch và báo cáo trực tiếp Chủ tịch UBND; bảo quản tài liệu chế độ Mật.",
        leadDepartmentId: deptTuPhap.id,
        assigneeId: userCvTuPhap.id,
        createdById: userQuanTri.id,
      },
      {
        direction: "DI",
        documentSymbol: "156/BC-UBND",
        docType: "BAO_CAO",
        urgency: "KHAN",
        security: "THUONG",
        status: "CHO_KY_BAN_HANH",
        title: "Báo cáo kết quả thực hiện Bộ chỉ số phục vụ người dân và doanh nghiệp tháng 11/2026",
        contentSummary:
          "Tổng hợp tỷ lệ hồ sơ trực tuyến toàn trình, tỷ lệ thanh toán trực tuyến và mức độ hài lòng của người dân tại Trung tâm Phục vụ Hành chính công Phường Thanh Nhàn.",
        issuingAgency: "UBND Phường Thanh Nhàn",
        recipientAgency: "Văn phòng UBND Thành phố; Sở Nội vụ",
        issuedDate: new Date("2026-11-11T06:00:00+07:00"),
        leadDepartmentId: deptMotCua.id,
        assigneeId: userMotCua.id,
        createdById: userQuanTri.id,
      },
    ],
  });

  // 7. Khởi tạo Bộ đếm tuần tự nguyên tử (SequenceCounter)
  await prisma.sequenceCounter.createMany({
    data: [
      { key: "DOSSIER_2026", value: 10 },
      { key: "RECEIPT_2026", value: 48 },
      { key: "APOLOGY_2026", value: 1 },
      { key: "DOC_DEN_2026", value: 419 },
      { key: "DOC_DI_2026", value: 103 },
      { key: "ERESULT_2026", value: 405 },
    ],
  });

  // 8. Nhật ký Kiểm toán ban đầu
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: userQuanTri.id,
        actorName: userQuanTri.fullName,
        actorRole: "QUAN_TRI",
        action: "KHOI_TAO_HE_THONG",
        entityType: "SYSTEM",
        entityCode: "HTTTHC-2026",
        detail: "Khởi tạo danh mục 05 Bộ phận chuyên môn, 08 Thủ tục hành chính chuẩn hóa và lịch nghỉ lễ năm 2026.",
      },
      {
        actorId: userLanhDao.id,
        actorName: userLanhDao.fullName,
        actorRole: "LANH_DAO",
        action: "PHE_DUYET_KET_QUA",
        entityType: "DOSSIER",
        entityCode: "HS-20261106-0006",
        detail: "Ký ban hành Giấy xác nhận tình trạng hôn nhân số 312/GXN-UBND, chuyển Một cửa thu phí trước khi trả kết quả.",
      },
    ],
  });

  console.log("[SEED] Hoan tat khoi tao du lieu thanh cong!");
}

main()
  .catch((err) => {
    console.error("[SEED ERROR]", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
