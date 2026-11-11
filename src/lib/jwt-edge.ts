import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import type { Role } from "@prisma/client";

export const SESSION_COOKIE_NAME = "httthc_session";

export interface SessionPayload {
  userId: string;
  username: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  departmentName: string | null;
  positionTitle: string | null;
}

function getSecretKey(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    "httthc-mot-cua-lien-thong-secret-key-2026-vn-official";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: String(payload.userId),
      username: String(payload.username),
      fullName: String(payload.fullName),
      role: payload.role as Role,
      departmentId: payload.departmentId ? String(payload.departmentId) : null,
      departmentName: payload.departmentName
        ? String(payload.departmentName)
        : null,
      positionTitle: payload.positionTitle ? String(payload.positionTitle) : null,
    };
  } catch {
    return null;
  }
}
