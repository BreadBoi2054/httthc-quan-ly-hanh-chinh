import { Prisma } from "@prisma/client";

/**
 * Cấp số thứ tự nguyên tử (Atomic Sequence Counter) thông qua bảng SequenceCounter
 * Chống trùng lặp mã hồ sơ, số biên lai, phiếu xin lỗi, số đến/đi văn bản khi có nhiều giao dịch đồng thời.
 */
export async function nextSequence(
  tx: Prisma.TransactionClient,
  key: string,
  fallbackFloor = 0
): Promise<number> {
  const record = await tx.sequenceCounter.upsert({
    where: { key },
    create: { key, value: fallbackFloor + 1 },
    update: { value: { increment: 1 } },
  });

  if (record.value <= fallbackFloor) {
    const bumped = await tx.sequenceCounter.update({
      where: { key },
      data: { value: fallbackFloor + 1 },
    });
    return bumped.value;
  }

  return record.value;
}
