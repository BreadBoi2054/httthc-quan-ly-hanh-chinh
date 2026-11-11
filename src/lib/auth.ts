import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { prisma } from "./db";
import {
  SESSION_COOKIE_NAME,
  SessionPayload,
  signSessionToken,
  verifySessionToken,
} from "./jwt-edge";

export {
  SESSION_COOKIE_NAME,
  type SessionPayload,
  signSessionToken,
  verifySessionToken,
};

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Đối chiếu trạng thái hoạt động & vai trò thực tế trên CSDL (thu hồi phiên tức thời khi khóa tài khoản)
  const dbUser = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      isActive: true,
      role: true,
      departmentId: true,
      fullName: true,
      positionTitle: true,
    },
  });

  if (!dbUser || !dbUser.isActive) {
    return null;
  }

  return {
    ...payload,
    role: dbUser.role,
    departmentId: dbUser.departmentId,
    fullName: dbUser.fullName,
    positionTitle: dbUser.positionTitle,
  };
}

export function isStaffRole(role: Role): boolean {
  return (
    role === "MOT_CUA" ||
    role === "CHUYEN_VIEN" ||
    role === "LANH_DAO" ||
    role === "QUAN_TRI"
  );
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp && firstIp.length <= 64) {
      return firstIp;
    }
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp && realIp.length <= 64) {
    return realIp;
  }
  return "127.0.0.1";
}
