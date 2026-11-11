import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentSession, isStaffRole, getClientIp } from "@/lib/auth";

const createProcedureSchema = z.object({
  code: z.string().trim().min(4, "Mã TTHC tối thiểu 4 ký tự"),
  name: z.string().trim().min(8, "Tên TTHC tối thiểu 8 ký tự"),
  field: z.string().trim().min(3, "Vui lòng chọn lĩnh vực"),
  serviceLevel: z.enum(["MOT_PHAN", "TOAN_TRINH"]),
  processingDays: z.coerce.number().int().min(0).max(60),
  processingHours: z.coerce.number().int().min(1).max(480),
  feeAmount: z.coerce.number().int().min(0).max(10000000),
  feePerCopy: z.boolean().optional().default(false),
  feeExemptionNote: z.string().trim().optional(),
  legalBasis: z.string().trim().min(5),
  executionSteps: z.string().trim().min(10),
  requiredDocs: z
    .array(
      z.object({
        code: z.string().min(2).max(40),
        name: z.string().min(4).max(250),
        mandatory: z.boolean().default(true),
      })
    )
    .min(1)
    .max(25),
  resultTemplate: z.string().trim().min(4),
  departmentId: z.string().min(1),
});

const updateProcedureSchema = z.object({
  id: z.string().min(1, "Thiếu định danh Thủ tục hành chính"),
  isActive: z.boolean().optional(),
  serviceLevel: z.enum(["MOT_PHAN", "TOAN_TRINH"]).optional(),
  processingDays: z.coerce.number().int().min(0).max(60).optional(),
  processingHours: z.coerce.number().int().min(1).max(480).optional(),
  feeAmount: z.coerce.number().int().min(0).max(10000000).optional(),
  feePerCopy: z.boolean().optional(),
  feeExemptionNote: z.string().trim().max(300).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const field = searchParams.get("field");
  const level = searchParams.get("level");
  const q = searchParams.get("q")?.trim();
  const requestedAll = searchParams.get("all") === "1";

  let includeInactive = false;
  if (requestedAll) {
    const session = await getCurrentSession();
    includeInactive = Boolean(session && isStaffRole(session.role));
  }

  const procedures = await prisma.procedure.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(field && field !== "ALL" ? { field } : {}),
      ...(level === "MOT_PHAN" || level === "TOAN_TRINH" ? { serviceLevel: level } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { field: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      department: true,
      _count: { select: { dossiers: true } },
    },
    orderBy: [{ field: "asc" }, { code: "asc" }],
  });

  const formatted = procedures.map((p) => ({
    ...p,
    requiredDocs: JSON.parse(p.requiredDocsJson || "[]"),
  }));

  return NextResponse.json({ procedures: formatted });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== "QUAN_TRI") {
    return NextResponse.json(
      { error: "Chỉ Quản trị viên hệ thống mới có quyền ban hành / cập nhật Danh mục Thủ tục hành chính." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createProcedureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu TTHC không hợp lệ" },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const exists = await prisma.procedure.findUnique({ where: { code: d.code } });
    if (exists) {
      return NextResponse.json(
        { error: `Mã thủ tục hành chính ${d.code} đã tồn tại trong danh mục.` },
        { status: 409 }
      );
    }

    const created = await prisma.procedure.create({
      data: {
        code: d.code,
        name: d.name,
        field: d.field,
        serviceLevel: d.serviceLevel,
        processingDays: d.processingDays,
        processingHours: d.processingHours,
        feeAmount: d.feeAmount,
        feePerCopy: d.feePerCopy,
        feeExemptionNote: d.feeExemptionNote || null,
        legalBasis: d.legalBasis,
        executionSteps: d.executionSteps,
        requiredDocsJson: JSON.stringify(d.requiredDocs),
        resultTemplate: d.resultTemplate,
        departmentId: d.departmentId,
      },
      include: { department: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorName: session.fullName,
        actorRole: session.role,
        action: "THEM_TTHC",
        entityType: "PROCEDURE",
        entityCode: created.code,
        detail: `Công bố mới Thủ tục hành chính "${created.name}" (${created.field}).`,
        ipAddress: getClientIp(req),
      },
    });

    return NextResponse.json({ ok: true, procedure: created }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_PROCEDURE_ERROR]", error);
    return NextResponse.json({ error: "Không thể lưu Thủ tục hành chính" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== "QUAN_TRI") {
    return NextResponse.json(
      { error: "Chỉ Quản trị viên mới có quyền điều chỉnh định mức hoặc trạng thái niêm yết TTHC." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = updateProcedureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Tham số cập nhật TTHC không hợp lệ." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const existing = await prisma.procedure.findUnique({ where: { id: input.id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy Thủ tục hành chính." }, { status: 404 });
    }

    const updated = await prisma.procedure.update({
      where: { id: existing.id },
      data: {
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.serviceLevel !== undefined ? { serviceLevel: input.serviceLevel } : {}),
        ...(input.processingDays !== undefined ? { processingDays: input.processingDays } : {}),
        ...(input.processingHours !== undefined ? { processingHours: input.processingHours } : {}),
        ...(input.feeAmount !== undefined ? { feeAmount: input.feeAmount } : {}),
        ...(input.feePerCopy !== undefined ? { feePerCopy: input.feePerCopy } : {}),
        ...(input.feeExemptionNote !== undefined ? { feeExemptionNote: input.feeExemptionNote || null } : {}),
      },
      include: { department: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorName: session.fullName,
        actorRole: session.role,
        action: "CAP_NHAT_TTHC",
        entityType: "PROCEDURE",
        entityCode: updated.code,
        detail: `Cập nhật cấu hình TTHC [${updated.code}] — Trạng thái: ${
          updated.isActive ? "Đang áp dụng" : "Tạm ngưng"
        }, Định mức: ${updated.processingDays} ngày (${updated.processingHours}h), Lệ phí: ${updated.feeAmount.toLocaleString(
          "vi-VN"
        )} đ.`,
        ipAddress: getClientIp(req),
      },
    });

    return NextResponse.json({ ok: true, procedure: updated });
  } catch (error) {
    console.error("[UPDATE_PROCEDURE_ERROR]", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi cập nhật Thủ tục hành chính" }, { status: 500 });
  }
}
