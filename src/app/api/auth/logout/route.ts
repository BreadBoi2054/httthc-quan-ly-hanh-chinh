import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getCurrentSession();
  if (session) {
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorName: session.fullName,
        actorRole: session.role,
        action: "DANG_XUAT",
        entityType: "USER",
        entityCode: session.username,
        detail: "Đăng xuất khỏi phiên làm việc.",
      },
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
