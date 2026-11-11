import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME, signSessionToken, getClientIp } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Thông tin đăng nhập không hợp lệ" },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
        isActive: true,
      },
      include: { department: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Tài khoản không tồn tại hoặc đã ngừng kích hoạt" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Mật khẩu xác thực không chính xác" }, { status: 401 });
    }

    const sessionPayload = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: user.department?.name ?? null,
      positionTitle: user.positionTitle ?? null,
    };

    const token = await signSessionToken(sessionPayload);

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        action: "DANG_NHAP",
        entityType: "USER",
        entityCode: user.username,
        detail: `Đăng nhập thành công vào hệ thống với vai trò ${user.role}.`,
        ipAddress: getClientIp(req),
      },
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        ...sessionPayload,
        citizenId: user.citizenId,
        phone: user.phone,
        email: user.email,
        address: user.address,
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi xử lý đăng nhập" }, { status: 500 });
  }
}
