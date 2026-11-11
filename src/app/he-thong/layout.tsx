import React from "react";
import { redirect } from "next/navigation";
import { getCurrentSession, isStaffRole } from "@/lib/auth";
import { StaffShell } from "@/components/StaffShell";

export default async function StaffWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/dang-nhap?redirect=/he-thong");
  }
  if (!isStaffRole(session.role)) {
    redirect("/ho-so-cua-toi");
  }

  return <StaffShell user={session}>{children}</StaffShell>;
}
