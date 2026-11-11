import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentSession, isStaffRole, getClientIp } from "@/lib/auth";

const holidaySchema = z.object({
  dateStr: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày nghỉ lễ phải đúng định dạng YYYY-MM-DD"),
  name: z.string().trim().min(3, "Tên ngày nghỉ lễ tối thiểu 3 ký tự").max(120),
});

export async function GET() {
  const session = await getCurrentSession();
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json(
      { error: "Không có quyền truy cập dữ liệu quản trị." },
      { status: 403 }
    );
  }

  const canViewAuditLogs =
    session.role === "QUAN_TRI" || session.role === "LANH_DAO";

  const [departments, staffUsers, holidays, auditLogs] = await Promise.all([
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["MOT_CUA", "CHUYEN_VIEN", "LANH_DAO", "QUAN_TRI"] },
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        positionTitle: true,
        phone: true,
        departmentId: true,
        department: { select: { code: true, name: true } },
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    }),
    prisma.holiday.findMany({ orderBy: { dateStr: "asc" } }),
    canViewAuditLogs
      ? prisma.auditLog.findMany({
          take: 50,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    currentRole: session.role,
    canViewAuditLogs,
    departments,
    staffUsers,
    holidays,
    auditLogs,
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== "QUAN_TRI") {
    return NextResponse.json(
      { error: "Chỉ Quản trị viên hệ thống mới được phép cấu hình Lịch nghỉ lễ SLA." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = holidaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Thông tin ngày nghỉ lễ không hợp lệ" },
        { status: 400 }
      );
    }

    const exists = await prisma.holiday.findUnique({
      where: { dateStr: parsed.data.dateStr },
    });
    if (exists) {
      return NextResponse.json(
        { error: `Ngày ${parsed.data.dateStr} đã tồn tại trong danh mục nghỉ lễ SLA.` },
        { status: 409 }
      );
    }

    const created = await prisma.holiday.create({
      data: {
        dateStr: parsed.data.dateStr,
        name: parsed.data.name,
        year: Number(parsed.data.dateStr.slice(0, 4)),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorName: session.fullName,
        actorRole: session.role,
        action: "THEM_NGAY_LE_SLA",
        entityType: "HOLIDAY",
        entityCode: created.dateStr,
        detail: `Cấu hình bổ sung ngày nghỉ lễ loại trừ SLA: ${created.name} (${created.dateStr}).`,
        ipAddress: getClientIp(req),
      },
    });

    return NextResponse.json({ ok: true, holiday: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Không thể thêm ngày nghỉ lễ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== "QUAN_TRI") {
    return NextResponse.json(
      { error: "Chỉ Quản trị viên hệ thống mới được phép xóa cấu hình Lịch nghỉ lễ SLA." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Thiếu mã ngày nghỉ lễ cần xóa." }, { status: 400 });
  }

  const existing = await prisma.holiday.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy ngày nghỉ lễ." }, { status: 404 });
  }

  await prisma.holiday.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
      action: "XOA_NGAY_LE_SLA",
      entityType: "HOLIDAY",
      entityCode: existing.dateStr,
      detail: `Gỡ bỏ ngày nghỉ lễ khỏi lịch tính SLA: ${existing.name} (${existing.dateStr}).`,
      ipAddress: getClientIp(req),
    },
  });

  return NextResponse.json({ ok: true });
}
