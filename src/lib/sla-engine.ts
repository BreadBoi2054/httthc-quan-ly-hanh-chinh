/**
 * Động cơ tính toán thời hạn giải quyết Thủ tục Hành chính (SLA Engine)
 * Tuân thủ quy định ngày & giờ làm việc hành chính Việt Nam (Nghị định 61/2018/NĐ-CP & 107/2021/NĐ-CP):
 * - Ca sáng: 07:30 - 11:30 (240 phút); Nghỉ trưa: 11:30 - 13:00; Ca chiều: 13:00 - 17:00 (240 phút).
 * - Tổng cộng: 480 phút (đúng 8 giờ làm việc hành chính / ngày, khớp khung tiếp nhận 07:30 - 17:00).
 * - Loại trừ Thứ Bảy (6), Chủ Nhật (0) và các ngày nghỉ lễ được cấu hình trong bảng Holiday.
 * - Hồ sơ nộp/tiếp nhận sau 17:00 hoặc vào ngày nghỉ tự động chuyển mốc tính hạn sang 07:30 ngày làm việc kế tiếp.
 * - Tạm dừng SLA (Mẫu 02) chỉ tính số phút làm việc thực tế bị gián đoạn (không cộng lố giờ đêm/cuối tuần/nghỉ lễ).
 */

export type SlaState =
  | "DA_HOAN_THANH_DUNG_HAN"
  | "DA_HOAN_THANH_QUA_HAN"
  | "TAM_DUNG_CHO_BO_SUNG"
  | "QUA_HAN_BO_SUNG"
  | "KET_THUC_KHONG_GIAI_QUYET"
  | "CHUA_TIEP_NHAN"
  | "TRONG_HAN"
  | "SAP_DEN_HAN"
  | "QUA_HAN";

export interface SlaEvaluation {
  state: SlaState;
  label: string;
  remainingHours: number | null;
  overdueHours: number | null;
  isWarning: boolean;
  isOverdue: boolean;
}

export function toVnDateKey(date: Date): string {
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().slice(0, 10);
}

export function isWorkingDay(date: Date, holidaySet: Set<string>): boolean {
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const dayOfWeek = vnTime.getUTCDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  const dateKey = vnTime.toISOString().slice(0, 10);
  return !holidaySet.has(dateKey);
}

function nextWorkingMorning(fromDateKey: string, holidaySet: Set<string>): Date {
  const cursor = new Date(`${fromDateKey}T07:30:00+07:00`);
  do {
    cursor.setTime(cursor.getTime() + 24 * 60 * 60 * 1000);
  } while (!isWorkingDay(cursor, holidaySet));
  return new Date(`${toVnDateKey(cursor)}T07:30:00+07:00`);
}

/**
 * Chuẩn hóa thời điểm bất kỳ về đúng thời điểm đang trong ca làm việc hành chính hợp lệ gần nhất
 */
export function normalizeToWorkingTime(date: Date, holidaySet: Set<string>): Date {
  const cursor = new Date(date.getTime());

  if (!isWorkingDay(cursor, holidaySet)) {
    return nextWorkingMorning(toVnDateKey(cursor), holidaySet);
  }

  const key = toVnDateKey(cursor);
  const morningStart = new Date(`${key}T07:30:00+07:00`);
  const morningEnd = new Date(`${key}T11:30:00+07:00`);
  const afternoonStart = new Date(`${key}T13:00:00+07:00`);
  const afternoonEnd = new Date(`${key}T17:00:00+07:00`);

  if (cursor.getTime() < morningStart.getTime()) {
    return morningStart;
  }
  if (cursor.getTime() > morningEnd.getTime() && cursor.getTime() < afternoonStart.getTime()) {
    return afternoonStart;
  }
  if (cursor.getTime() >= afternoonEnd.getTime()) {
    return nextWorkingMorning(key, holidaySet);
  }
  return cursor;
}

/**
 * Cộng chính xác số phút làm việc hành chính (chỉ chạy trong ca 07:30-11:30 và 13:00-17:00 của ngày làm việc)
 */
export function addWorkingMinutes(
  startAt: Date,
  minutesToAdd: number,
  holidayDates: string[]
): Date {
  const holidaySet = new Set(holidayDates);
  let cursor = normalizeToWorkingTime(startAt, holidaySet);
  let remaining = Math.max(0, Math.round(minutesToAdd));

  while (remaining > 0) {
    const key = toVnDateKey(cursor);
    const morningEnd = new Date(`${key}T11:30:00+07:00`);
    const afternoonStart = new Date(`${key}T13:00:00+07:00`);
    const afternoonEnd = new Date(`${key}T17:00:00+07:00`);

    if (cursor.getTime() < morningEnd.getTime()) {
      const availMorning = Math.max(
        0,
        Math.round((morningEnd.getTime() - cursor.getTime()) / 60000)
      );
      if (remaining <= availMorning) {
        return new Date(cursor.getTime() + remaining * 60000);
      }
      remaining -= availMorning;
      cursor = afternoonStart;
      continue;
    }

    const availAfternoon = Math.max(
      0,
      Math.round((afternoonEnd.getTime() - cursor.getTime()) / 60000)
    );
    if (remaining <= availAfternoon) {
      return new Date(cursor.getTime() + remaining * 60000);
    }
    remaining -= availAfternoon;
    cursor = nextWorkingMorning(key, holidaySet);
  }

  return cursor;
}

/**
 * Đếm chính xác số phút làm việc hành chính giữa hai mốc thời gian (loại trừ giờ nghỉ trưa 11:30-13:00, ban đêm, T7/CN, ngày lễ)
 */
export function calculateWorkingMinutesBetween(
  startAt: Date,
  endAt: Date,
  holidayDates: string[]
): number {
  const startMs = startAt.getTime();
  const endMs = endAt.getTime();
  if (endMs <= startMs) return 0;

  const holidaySet = new Set(holidayDates);
  const startKey = toVnDateKey(startAt);
  const endKey = toVnDateKey(endAt);
  let dayCursor = new Date(`${startKey}T07:30:00+07:00`);
  let totalMinutes = 0;

  while (toVnDateKey(dayCursor) <= endKey) {
    if (isWorkingDay(dayCursor, holidaySet)) {
      const key = toVnDateKey(dayCursor);
      const shifts: Array<[number, number]> = [
        [
          new Date(`${key}T07:30:00+07:00`).getTime(),
          new Date(`${key}T11:30:00+07:00`).getTime(),
        ],
        [
          new Date(`${key}T13:00:00+07:00`).getTime(),
          new Date(`${key}T17:00:00+07:00`).getTime(),
        ],
      ];

      for (const [shiftStart, shiftEnd] of shifts) {
        const overlapStart = Math.max(startMs, shiftStart);
        const overlapEnd = Math.min(endMs, shiftEnd);
        if (overlapEnd > overlapStart) {
          totalMinutes += Math.round((overlapEnd - overlapStart) / 60000);
        }
      }
    }
    dayCursor = new Date(dayCursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return totalMinutes;
}

/**
 * Tính hạn trả kết quả từ thời điểm tiếp nhận hợp lệ:
 * - Hồ sơ tiếp nhận sau 17:00 hoặc vào ngày nghỉ tự động tính từ 08:00 ngày làm việc kế tiếp.
 * - Nếu processingDays === 0 (giải quyết theo giờ trong ngày, ví dụ Chứng thực bản sao 4 giờ):
 *   Cộng đúng `processingHours * 60` phút làm việc hành chính (trừ nghỉ trưa 11:30-13:30).
 * - Nếu processingDays >= 1: Cộng đúng `processingDays` ngày làm việc, chốt lúc 17:00 giờ VN.
 */
export function calculateDueDate(
  acceptedAt: Date,
  processingDays: number,
  processingHours: number,
  holidayDates: string[]
): Date {
  const holidaySet = new Set(holidayDates);
  const effectiveStart = normalizeToWorkingTime(acceptedAt, holidaySet);

  if (processingDays <= 0) {
    const hours = Math.max(1, processingHours);
    return addWorkingMinutes(effectiveStart, hours * 60, holidayDates);
  }

  let remainingWorkingDays = processingDays;
  const stepDate = new Date(`${toVnDateKey(effectiveStart)}T17:00:00+07:00`);

  while (remainingWorkingDays > 0) {
    stepDate.setTime(stepDate.getTime() + 24 * 60 * 60 * 1000);
    if (isWorkingDay(stepDate, holidaySet)) {
      remainingWorkingDays -= 1;
    }
  }

  const finalKey = toVnDateKey(stepDate);
  return new Date(`${finalKey}T17:00:00+07:00`);
}

/**
 * Cộng thêm số ngày làm việc gia hạn hoặc tính thời hạn bổ sung hồ sơ (chốt 17:00 ngày làm việc)
 */
export function addWorkingDays(
  baseDueDate: Date,
  extraWorkingDays: number,
  holidayDates: string[]
): Date {
  const holidaySet = new Set(holidayDates);
  const stepDate = new Date(baseDueDate.getTime());
  let remaining = Math.max(1, extraWorkingDays);

  while (remaining > 0) {
    stepDate.setTime(stepDate.getTime() + 24 * 60 * 60 * 1000);
    if (isWorkingDay(stepDate, holidaySet)) {
      remaining -= 1;
    }
  }

  const finalKey = toVnDateKey(stepDate);
  return new Date(`${finalKey}T17:00:00+07:00`);
}

/**
 * Cộng bù số phút làm việc tạm dừng chờ công dân bổ sung hồ sơ vào hạn trả kết quả,
 * đảm bảo mốc trả mới luôn nằm trong khung ca làm việc (08:00-11:30 / 13:30-17:00) của ngày làm việc hợp lệ.
 */
export function compensatePausedDuration(
  currentDueAt: Date,
  pausedWorkingMinutes: number,
  holidayDates: string[]
): Date {
  if (pausedWorkingMinutes <= 0) {
    return new Date(currentDueAt.getTime());
  }
  return addWorkingMinutes(currentDueAt, pausedWorkingMinutes, holidayDates);
}

/**
 * Đánh giá trạng thái SLA hiện tại của một hồ sơ (bao gồm cảnh báo quá hạn nộp bổ sung Mẫu 02)
 */
export function evaluateDossierSla(params: {
  status: string;
  dueAt: Date | string | null;
  completedAt: Date | string | null;
  slaPausedAt?: Date | string | null;
  supplementDeadline?: Date | string | null;
  now?: Date;
}): SlaEvaluation {
  const now = params.now ?? new Date();
  const dueAt = params.dueAt ? new Date(params.dueAt) : null;
  const completedAt = params.completedAt ? new Date(params.completedAt) : null;
  const slaPausedAt = params.slaPausedAt ? new Date(params.slaPausedAt) : null;
  const supplementDeadline = params.supplementDeadline
    ? new Date(params.supplementDeadline)
    : null;

  if (params.status === "TU_CHOI_TIEP_NHAN" || params.status === "DA_RUT_HO_SO") {
    return {
      state: "KET_THUC_KHONG_GIAI_QUYET",
      label: "Đã đóng hồ sơ",
      remainingHours: null,
      overdueHours: null,
      isWarning: false,
      isOverdue: false,
    };
  }

  if (params.status === "YEU_CAU_BO_SUNG") {
    if (supplementDeadline && now.getTime() > supplementDeadline.getTime()) {
      const lateSuppHours =
        Math.round(((now.getTime() - supplementDeadline.getTime()) / 3600000) * 10) / 10;
      return {
        state: "QUA_HAN_BO_SUNG",
        label: `Quá hạn bổ sung Mẫu 02 (${lateSuppHours}h)`,
        remainingHours: null,
        overdueHours: lateSuppHours,
        isWarning: false,
        isOverdue: true,
      };
    }
    if (dueAt && slaPausedAt && slaPausedAt.getTime() > dueAt.getTime()) {
      const pausedLateHours =
        Math.round(((slaPausedAt.getTime() - dueAt.getTime()) / 3600000) * 10) / 10;
      return {
        state: "TAM_DUNG_CHO_BO_SUNG",
        label: `Tạm dừng SLA (Đã trễ ${pausedLateHours}h trước khi dừng)`,
        remainingHours: null,
        overdueHours: pausedLateHours,
        isWarning: false,
        isOverdue: true,
      };
    }
    return {
      state: "TAM_DUNG_CHO_BO_SUNG",
      label: "Tạm dừng SLA (Chờ bổ sung)",
      remainingHours: null,
      overdueHours: null,
      isWarning: false,
      isOverdue: false,
    };
  }

  if (params.status === "MOI_NOP" || !dueAt) {
    return {
      state: "CHUA_TIEP_NHAN",
      label: "Chờ tiếp nhận & tính hạn",
      remainingHours: null,
      overdueHours: null,
      isWarning: false,
      isOverdue: false,
    };
  }

  if (params.status === "HOAN_THANH") {
    const finishRef = completedAt ?? now;
    if (finishRef.getTime() <= dueAt.getTime()) {
      const earlyHours =
        Math.round(((dueAt.getTime() - finishRef.getTime()) / 3600000) * 10) / 10;
      return {
        state: "DA_HOAN_THANH_DUNG_HAN",
        label: earlyHours >= 24 ? "Hoàn thành trước hạn" : "Hoàn thành đúng hạn",
        remainingHours: earlyHours,
        overdueHours: null,
        isWarning: false,
        isOverdue: false,
      };
    } else {
      const lateHours =
        Math.round(((finishRef.getTime() - dueAt.getTime()) / 3600000) * 10) / 10;
      return {
        state: "DA_HOAN_THANH_QUA_HAN",
        label: `Hoàn thành trễ hạn (${lateHours}h)`,
        remainingHours: null,
        overdueHours: lateHours,
        isWarning: false,
        isOverdue: true,
      };
    }
  }

  const diffHours = Math.round(((dueAt.getTime() - now.getTime()) / 3600000) * 10) / 10;
  if (diffHours < 0) {
    const overdue = Math.abs(diffHours);
    return {
      state: "QUA_HAN",
      label: `Quá hạn ${overdue} giờ`,
      remainingHours: null,
      overdueHours: overdue,
      isWarning: false,
      isOverdue: true,
    };
  }

  if (diffHours <= 24) {
    return {
      state: "SAP_DEN_HAN",
      label: `Sắp đến hạn (còn ${diffHours}h)`,
      remainingHours: diffHours,
      overdueHours: null,
      isWarning: true,
      isOverdue: false,
    };
  }

  return {
    state: "TRONG_HAN",
    label: `Trong hạn (còn ${Math.ceil(diffHours / 24)} ngày)`,
    remainingHours: diffHours,
    overdueHours: null,
    isWarning: false,
    isOverdue: false,
  };
}
