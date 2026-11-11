import { Prisma } from "@prisma/client";

/**
 * Chọn Chuyên viên đang hoạt động thuộc đúng phòng ban chuyên môn có số lượng hồ sơ đang xử lý thấp nhất
 */
export async function pickLeastLoadedSpecialist(
  tx: Prisma.TransactionClient,
  departmentId: string
): Promise<string | null> {
  const specialists = await tx.user.findMany({
    where: {
      role: "CHUYEN_VIEN",
      departmentId,
      isActive: true,
    },
    select: {
      id: true,
      _count: {
        select: {
          assignedDossiers: {
            where: {
              status: {
                in: ["DA_TIEP_NHAN", "DANG_THAM_DINH", "YEU_CAU_BO_SUNG", "CHO_PHE_DUYET"],
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (specialists.length === 0) return null;

  specialists.sort(
    (a, b) => a._count.assignedDossiers - b._count.assignedDossiers
  );
  return specialists[0].id;
}
