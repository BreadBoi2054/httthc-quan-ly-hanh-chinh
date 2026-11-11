import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { department: true },
  });

  if (!dbUser || !dbUser.isActive) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: dbUser.id,
      username: dbUser.username,
      fullName: dbUser.fullName,
      role: dbUser.role,
      citizenId: dbUser.citizenId,
      phone: dbUser.phone,
      email: dbUser.email,
      address: dbUser.address,
      positionTitle: dbUser.positionTitle,
      departmentId: dbUser.departmentId,
      departmentName: dbUser.department?.name ?? null,
    },
  });
}
