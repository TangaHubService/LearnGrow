import { Prisma, RecordStatus, TimetableDay } from "@prisma/client";
import { AppError } from "../../http/errors.js";
import { prisma } from "../../prisma/client.js";

// ──────────────────────────────────────────
// Conflict Detection
// ──────────────────────────────────────────

export interface ConflictCheckInput {
  classId: string;
  teacherId?: string | null;
  room?: string | null;
  roomId?: string | null;
  dayOfWeek: TimetableDay;
  startTime: string;
  endTime: string;
  termId?: string | null;
  excludeId?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  teacherConflict: boolean;
  classConflict: boolean;
  roomConflict: boolean;
  details: string[];
}

export async function checkSchedulingConflicts(input: ConflictCheckInput): Promise<ConflictResult> {
  const result: ConflictResult = {
    hasConflict: false,
    teacherConflict: false,
    classConflict: false,
    roomConflict: false,
    details: []
  };

  const where: Prisma.TimetablePeriodWhereInput = {
    dayOfWeek: input.dayOfWeek,
    termId: input.termId,
    status: RecordStatus.ACTIVE,
    ...(input.excludeId ? { id: { not: input.excludeId } } : {})
  };

  // Time overlap filter: existing period overlaps with proposed period
  const timeOverlapFilter: Prisma.TimetablePeriodWhereInput = {
    OR: [
      { startTime: { lte: input.startTime }, endTime: { gt: input.startTime } },
      { startTime: { lt: input.endTime }, endTime: { gte: input.endTime } },
      { startTime: { gte: input.startTime }, endTime: { lte: input.endTime } }
    ]
  };

  // 1. Teacher conflict: teacher assigned to another class at same time
  if (input.teacherId) {
    const teacherConflict = await prisma.timetablePeriod.findFirst({
      where: {
        ...where,
        teacherId: input.teacherId,
        ...timeOverlapFilter
      }
    });
    if (teacherConflict) {
      result.hasConflict = true;
      result.teacherConflict = true;
      result.details.push(
        `Teacher is already assigned to class ${teacherConflict.classId} on ${input.dayOfWeek} at ${teacherConflict.startTime}-${teacherConflict.endTime}`
      );
    }
  }

  // 2. Class conflict: class already has a lesson at this time
  const classConflict = await prisma.timetablePeriod.findFirst({
    where: {
      ...where,
      classId: input.classId,
      ...timeOverlapFilter
    }
  });
  if (classConflict) {
    result.hasConflict = true;
    result.classConflict = true;
    result.details.push(
      `Class already has a lesson on ${input.dayOfWeek} at ${classConflict.startTime}-${classConflict.endTime}`
    );
  }

  // 3. Room conflict: room already assigned at this time
  const roomIdentifier = input.roomId ?? input.room;
  if (roomIdentifier) {
    const roomConflictWhere: Prisma.TimetablePeriodWhereInput = {
      ...where,
      ...timeOverlapFilter,
      OR: undefined // clear the OR from timeOverlapFilter
    };
    roomConflictWhere.OR = [
      { roomId: input.roomId ?? undefined },
      { room: input.room ?? undefined }
    ].filter(clause => Object.values(clause)[0] !== undefined) as Prisma.TimetablePeriodWhereInput[];

    if (roomConflictWhere.OR && roomConflictWhere.OR.length > 0) {
      const roomConflict = await prisma.timetablePeriod.findFirst({
        where: {
          dayOfWeek: input.dayOfWeek,
          termId: input.termId,
          status: RecordStatus.ACTIVE,
          ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
          ...timeOverlapFilter,
          OR: roomConflictWhere.OR
        }
      });
      if (roomConflict) {
        result.hasConflict = true;
        result.roomConflict = true;
        result.details.push(
          `Room is already assigned on ${input.dayOfWeek} at ${roomConflict.startTime}-${roomConflict.endTime}`
        );
      }
    }
  }

  return result;
}

// ──────────────────────────────────────────
// Workload Validation
// ──────────────────────────────────────────

export interface WorkloadCheckInput {
  teacherId: string;
  termId?: string | null;
  academicYearId?: string | null;
  dayOfWeek?: TimetableDay;
  schoolId: string;
}

export async function checkTeacherWorkload(input: WorkloadCheckInput): Promise<{
  withinLimits: boolean;
  currentDayCount: number;
  currentWeekCount: number;
  maxDay: number;
  maxWeek: number;
  message?: string;
}> {
  const workload = await prisma.teacherWorkload.findFirst({
    where: {
      teacherId: input.teacherId,
      schoolId: input.schoolId,
      ...(input.termId ? { termId: input.termId } : {}),
      ...(input.academicYearId ? { academicYearId: input.academicYearId } : {}),
      status: RecordStatus.ACTIVE
    }
  });

  const maxDay = workload?.maxPeriodsPerDay ?? 8;
  const maxWeek = workload?.maxPeriodsPerWeek ?? 40;

  const [currentDayCount, currentWeekCount] = await Promise.all([
    input.dayOfWeek
      ? prisma.timetablePeriod.count({
          where: {
            teacherId: input.teacherId,
            dayOfWeek: input.dayOfWeek,
            termId: input.termId ?? undefined,
            status: RecordStatus.ACTIVE
          }
        })
      : Promise.resolve(0),
    prisma.timetablePeriod.count({
      where: {
        teacherId: input.teacherId,
        termId: input.termId ?? undefined,
        status: RecordStatus.ACTIVE
      }
    })
  ]);

  const issues: string[] = [];
  if (input.dayOfWeek && currentDayCount >= maxDay) {
    issues.push(`Teacher already has ${currentDayCount}/${maxDay} periods on this day`);
  }
  if (currentWeekCount >= maxWeek) {
    issues.push(`Teacher already has ${currentWeekCount}/${maxWeek} periods this term`);
  }

  return {
    withinLimits: issues.length === 0,
    currentDayCount,
    currentWeekCount,
    maxDay,
    maxWeek,
    message: issues.length > 0 ? issues.join("; ") : undefined
  };
}

// ──────────────────────────────────────────
// Period Validation
// ──────────────────────────────────────────

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export async function validatePeriodSequence(
  classId: string,
  dayOfWeek: TimetableDay,
  termId: string,
  startTime: string,
  endTime: string
): Promise<{ valid: boolean; message?: string }> {
  const existingPeriods = await prisma.timetablePeriod.findMany({
    where: {
      classId,
      dayOfWeek,
      termId,
      status: RecordStatus.ACTIVE
    },
    orderBy: { startTime: "asc" }
  });

  const newStartMinutes = parseTimeToMinutes(startTime);
  const newEndMinutes = parseTimeToMinutes(endTime);

  for (const existing of existingPeriods) {
    const existStartMinutes = parseTimeToMinutes(existing.startTime);
    const existEndMinutes = parseTimeToMinutes(existing.endTime);

    if (newStartMinutes < existEndMinutes && newEndMinutes > existStartMinutes) {
      return {
        valid: false,
        message: `Period overlaps with existing ${existing.startTime}-${existing.endTime}`
      };
    }

    const gapMinutes = newStartMinutes - existEndMinutes;
    if (gapMinutes > 0 && gapMinutes < 5) {
      return {
        valid: false,
        message: `Insufficient gap (${gapMinutes}min) between periods`
      };
    }
  }

  return { valid: true };
}

// ──────────────────────────────────────────
// CRUD Operations
// ──────────────────────────────────────────

export async function createTimetableEntry(
  schoolId: string,
  data: {
    classId: string;
    subjectId: string;
    teacherId: string;
    roomId?: string | null;
    room?: string | null;
    periodId?: string | null;
    dayOfWeek: TimetableDay;
    startTime: string;
    endTime: string;
    isDoublePeriod?: boolean;
    shift?: string;
    academicYearId: string;
    termId: string;
  },
  createdById?: string
) {
  // Validate scheduling conflicts
  const conflicts = await checkSchedulingConflicts({
    classId: data.classId,
    teacherId: data.teacherId,
    room: data.room,
    roomId: data.roomId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    termId: data.termId
  });

  if (conflicts.hasConflict) {
    throw new AppError(409, conflicts.details.join("; "), "SCHEDULING_CONFLICT");
  }

  // Validate period sequence
  const sequence = await validatePeriodSequence(
    data.classId,
    data.dayOfWeek,
    data.termId,
    data.startTime,
    data.endTime
  );
  if (!sequence.valid) {
    throw new AppError(400, sequence.message!, "INVALID_PERIOD_SEQUENCE");
  }

  // Check teacher workload
  const workload = await checkTeacherWorkload({
    teacherId: data.teacherId,
    termId: data.termId,
    academicYearId: data.academicYearId,
    dayOfWeek: data.dayOfWeek,
    schoolId
  });
  if (!workload.withinLimits) {
    throw new AppError(409, workload.message!, "TEACHER_WORKLOAD_EXCEEDED");
  }

  try {
    const entry = await prisma.timetablePeriod.create({
      data: {
        schoolId,
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        roomId: data.roomId ?? null,
        room: data.room ?? null,
        periodId: data.periodId ?? null,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isDoublePeriod: data.isDoublePeriod ?? false,
        shift: data.shift ?? "MORNING",
        academicYearId: data.academicYearId,
        termId: data.termId,
        status: RecordStatus.ACTIVE
      },
      include: {
        class: { include: { level: true } },
        subject: true,
        teacher: { include: { user: true } },
        roomRef: true
      }
    });
    return entry;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new AppError(409, "A timetable entry already exists for this class at this time", "DUPLICATE_ENTRY");
      }
    }
    throw error;
  }
}

export async function updateTimetableEntry(
  id: string,
  schoolId: string,
  data: {
    classId?: string;
    subjectId?: string;
    teacherId?: string;
    roomId?: string | null;
    room?: string | null;
    periodId?: string | null;
    dayOfWeek?: TimetableDay;
    startTime?: string;
    endTime?: string;
    isDoublePeriod?: boolean;
    shift?: string;
    academicYearId?: string;
    termId?: string;
    status?: RecordStatus;
  },
  updatedById?: string
) {
  const existing = await prisma.timetablePeriod.findFirst({
    where: { id, schoolId }
  });
  if (!existing) {
    throw new AppError(404, "Timetable entry not found", "ENTRY_NOT_FOUND");
  }

  const merged = {
    classId: data.classId ?? existing.classId,
    teacherId: data.teacherId ?? existing.teacherId,
    room: data.room !== undefined ? data.room : existing.room,
    roomId: data.roomId !== undefined ? data.roomId : existing.roomId,
    dayOfWeek: data.dayOfWeek ?? existing.dayOfWeek,
    startTime: data.startTime ?? existing.startTime,
    endTime: data.endTime ?? existing.endTime,
    termId: data.termId ?? existing.termId
  };

  // Validate conflicts (exclude self)
  const conflicts = await checkSchedulingConflicts({
    classId: merged.classId,
    teacherId: merged.teacherId,
    room: merged.room,
    roomId: merged.roomId,
    dayOfWeek: merged.dayOfWeek,
    startTime: merged.startTime,
    endTime: merged.endTime,
    termId: merged.termId,
    excludeId: id
  });

  if (conflicts.hasConflict) {
    throw new AppError(409, conflicts.details.join("; "), "SCHEDULING_CONFLICT");
  }

  try {
    const entry = await prisma.timetablePeriod.update({
      where: { id },
      data: {
        ...(data.classId !== undefined && { classId: data.classId }),
        ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
        ...(data.teacherId !== undefined && { teacherId: data.teacherId }),
        ...(data.roomId !== undefined && { roomId: data.roomId }),
        ...(data.room !== undefined && { room: data.room }),
        ...(data.periodId !== undefined && { periodId: data.periodId }),
        ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.isDoublePeriod !== undefined && { isDoublePeriod: data.isDoublePeriod }),
        ...(data.shift !== undefined && { shift: data.shift }),
        ...(data.academicYearId !== undefined && { academicYearId: data.academicYearId }),
        ...(data.termId !== undefined && { termId: data.termId }),
        ...(data.status !== undefined && { status: data.status })
      },
      include: {
        class: { include: { level: true } },
        subject: true,
        teacher: { include: { user: true } },
        roomRef: true
      }
    });
    return entry;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new AppError(409, "A timetable entry already exists for this class at this time", "DUPLICATE_ENTRY");
      }
    }
    throw error;
  }
}

export async function deleteTimetableEntry(id: string, schoolId: string) {
  const existing = await prisma.timetablePeriod.findFirst({
    where: { id, schoolId }
  });
  if (!existing) {
    throw new AppError(404, "Timetable entry not found", "ENTRY_NOT_FOUND");
  }
  await prisma.timetablePeriod.update({
    where: { id },
    data: { status: RecordStatus.DELETED }
  });
  return { deleted: true };
}

export async function getTimetableEntry(id: string, schoolId: string) {
  const entry = await prisma.timetablePeriod.findFirst({
    where: { id, schoolId, status: { not: RecordStatus.DELETED } },
    include: {
      class: { include: { level: true } },
      subject: true,
      teacher: { include: { user: true } },
      roomRef: true,
      period: true
    }
  });
  if (!entry) {
    throw new AppError(404, "Timetable entry not found", "ENTRY_NOT_FOUND");
  }
  return entry;
}

export async function listTimetableEntries(
  schoolId: string,
  filters: {
    classId?: string;
    teacherId?: string;
    roomId?: string;
    dayOfWeek?: TimetableDay;
    termId?: string;
    academicYearId?: string;
    shift?: string;
    status?: string;
    page: number;
    pageSize: number;
  }
) {
  const where: Prisma.TimetablePeriodWhereInput = {
    schoolId,
    ...(filters.classId && { classId: filters.classId }),
    ...(filters.teacherId && { teacherId: filters.teacherId }),
    ...(filters.roomId && { roomId: filters.roomId }),
    ...(filters.dayOfWeek && { dayOfWeek: filters.dayOfWeek }),
    ...(filters.termId && { termId: filters.termId }),
    ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
    ...(filters.shift && { shift: filters.shift }),
    ...(filters.status ? { status: filters.status as RecordStatus } : { status: { not: RecordStatus.DELETED } })
  };

  const [items, total] = await Promise.all([
    prisma.timetablePeriod.findMany({
      where,
      include: {
        class: { include: { level: true } },
        subject: true,
        teacher: { include: { user: true } },
        roomRef: true,
        period: true
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" }
      ],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize
    }),
    prisma.timetablePeriod.count({ where })
  ]);

  return { items, meta: { page: filters.page, pageSize: filters.pageSize, total } };
}

// ──────────────────────────────────────────
// Timetable Grid View
// ──────────────────────────────────────────

export async function getTimetableGrid(
  schoolId: string,
  filters: {
    classId?: string;
    teacherId?: string;
    roomId?: string;
    termId: string;
    shift?: string;
  }
) {
  const where: Prisma.TimetablePeriodWhereInput = {
    schoolId,
    termId: filters.termId,
    status: RecordStatus.ACTIVE,
    ...(filters.classId && { classId: filters.classId }),
    ...(filters.teacherId && { teacherId: filters.teacherId }),
    ...(filters.roomId && { roomId: filters.roomId }),
    ...(filters.shift && { shift: filters.shift })
  };

  const entries = await prisma.timetablePeriod.findMany({
    where,
    include: {
      class: { include: { level: true } },
      subject: true,
      teacher: { include: { user: true } },
      roomRef: true
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" }
    ]
  });

  // Group by day of week
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
  const grid = days.reduce((acc, day) => {
    acc[day] = entries.filter(e => e.dayOfWeek === day);
    return acc;
  }, {} as Record<string, typeof entries>);

  // Collect unique time slots
  const timeSlots = [...new Set(entries.map(e => `${e.startTime}-${e.endTime}`))].sort();

  return { grid, timeSlots, days: days.filter(d => (grid[d]?.length ?? 0) > 0 || true) };
}

// ──────────────────────────────────────────
// Room & Period Management
// ──────────────────────────────────────────

export async function createRoom(schoolId: string, data: {
  name: string;
  type?: string;
  capacity?: number | null;
  building?: string;
  floor?: string;
}) {
  try {
    return await prisma.room.create({
      data: {
        schoolId,
        name: data.name,
        type: data.type as any ?? "CLASSROOM",
        capacity: data.capacity ?? null,
        building: data.building ?? null,
        floor: data.floor ?? null
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "A room with this name already exists", "ROOM_NAME_TAKEN");
    }
    throw error;
  }
}

export async function updateRoom(id: string, schoolId: string, data: {
  name?: string;
  type?: string;
  capacity?: number | null;
  building?: string;
  floor?: string;
}) {
  const existing = await prisma.room.findFirst({ where: { id, schoolId } });
  if (!existing) throw new AppError(404, "Room not found", "ROOM_NOT_FOUND");
  return prisma.room.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type as any }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.building !== undefined && { building: data.building }),
      ...(data.floor !== undefined && { floor: data.floor })
    }
  });
}

export async function deleteRoom(id: string, schoolId: string) {
  const existing = await prisma.room.findFirst({ where: { id, schoolId } });
  if (!existing) throw new AppError(404, "Room not found", "ROOM_NOT_FOUND");
  await prisma.room.update({ where: { id }, data: { status: RecordStatus.DELETED } });
  return { deleted: true };
}

export async function listRooms(schoolId: string, type?: string) {
  return prisma.room.findMany({
    where: {
      schoolId,
      status: { not: RecordStatus.DELETED },
      ...(type && { type: type as any })
    },
    orderBy: { name: "asc" }
  });
}

export async function createPeriod(schoolId: string, data: {
  name: string;
  startTime: string;
  endTime: string;
  slotIndex: number;
  shift?: string;
}) {
  try {
    return await prisma.period.create({
      data: {
        schoolId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        slotIndex: data.slotIndex,
        shift: data.shift ?? "MORNING"
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "A period with this name or slot index already exists", "PERIOD_CONFLICT");
    }
    throw error;
  }
}

export async function updatePeriod(id: string, schoolId: string, data: {
  name?: string;
  startTime?: string;
  endTime?: string;
  slotIndex?: number;
  shift?: string;
}) {
  const existing = await prisma.period.findFirst({ where: { id, schoolId } });
  if (!existing) throw new AppError(404, "Period not found", "PERIOD_NOT_FOUND");
  return prisma.period.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.startTime !== undefined && { startTime: data.startTime }),
      ...(data.endTime !== undefined && { endTime: data.endTime }),
      ...(data.slotIndex !== undefined && { slotIndex: data.slotIndex }),
      ...(data.shift !== undefined && { shift: data.shift })
    }
  });
}

export async function listPeriods(schoolId: string, shift?: string) {
  return prisma.period.findMany({
    where: {
      schoolId,
      status: { not: RecordStatus.DELETED },
      ...(shift && { shift })
    },
    orderBy: [{ slotIndex: "asc" }]
  });
}

// ──────────────────────────────────────────
// Teacher Workload Management
// ──────────────────────────────────────────

export async function setTeacherWorkload(schoolId: string, data: {
  teacherId: string;
  academicYearId?: string | null;
  termId?: string | null;
  maxPeriodsPerDay?: number;
  maxPeriodsPerWeek?: number;
  maxConsecutivePeriods?: number;
}) {
  const existing = await prisma.teacherWorkload.findFirst({
    where: {
      teacherId: data.teacherId,
      schoolId,
      ...(data.academicYearId ? { academicYearId: data.academicYearId } : { academicYearId: null }),
      ...(data.termId ? { termId: data.termId } : { termId: null })
    }
  });

  if (existing) {
    return prisma.teacherWorkload.update({
      where: { id: existing.id },
      data: {
        maxPeriodsPerDay: data.maxPeriodsPerDay ?? existing.maxPeriodsPerDay,
        maxPeriodsPerWeek: data.maxPeriodsPerWeek ?? existing.maxPeriodsPerWeek,
        maxConsecutivePeriods: data.maxConsecutivePeriods ?? existing.maxConsecutivePeriods
      }
    });
  }

  return prisma.teacherWorkload.create({
    data: {
      teacherId: data.teacherId,
      schoolId,
      academicYearId: data.academicYearId ?? null,
      termId: data.termId ?? null,
      maxPeriodsPerDay: data.maxPeriodsPerDay ?? 8,
      maxPeriodsPerWeek: data.maxPeriodsPerWeek ?? 40,
      maxConsecutivePeriods: data.maxConsecutivePeriods ?? 3
    }
  });
}

// ──────────────────────────────────────────
// Auto-Generation Algorithm
// ──────────────────────────────────────────

export interface GenerateTimetableInput {
  schoolId: string;
  academicYearId: string;
  termId: string;
  shift?: string;
  classIds?: string[];
  respectWorkload?: boolean;
  preferDoublePeriods?: boolean;
  clearExisting?: boolean;
}

function generateTimeSlots(): Array<{ startTime: string; endTime: string }> {
  return [
    { startTime: "07:30", endTime: "08:10" },
    { startTime: "08:15", endTime: "08:55" },
    { startTime: "09:10", endTime: "09:50" },
    { startTime: "09:55", endTime: "10:35" },
    { startTime: "10:50", endTime: "11:30" },
    { startTime: "11:35", endTime: "12:15" }
  ];
}

const SCHOOL_DAYS: TimetableDay[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"
];

export async function autoGenerateTimetable(input: GenerateTimetableInput) {
  const {
    schoolId,
    academicYearId,
    termId,
    shift = "MORNING",
    classIds,
    respectWorkload = true,
    preferDoublePeriods = true,
    clearExisting = false
  } = input;

  // Clear existing entries if requested
  if (clearExisting) {
    await prisma.timetablePeriod.deleteMany({
      where: {
        schoolId,
        termId,
        shift,
        ...(classIds ? { classId: { in: classIds } } : {})
      }
    });
  }

  // Fetch all classes with their subjects and assignments
  const classWhere = classIds ? { id: { in: classIds } } : {};
  const classes = await prisma.class.findMany({
    where: { ...classWhere, schoolId },
    include: { level: true }
  });

  // Fetch active teacher assignments
  const assignments = await prisma.teacherClassAssignment.findMany({
    where: {
      schoolId,
      status: RecordStatus.ACTIVE
    }
  });

  // Group assignments by class
  const assignmentsByClass = new Map<string, typeof assignments>();
  for (const assignment of assignments) {
    const list = assignmentsByClass.get(assignment.classId) ?? [];
    list.push(assignment);
    assignmentsByClass.set(assignment.classId, list);
  }

  // Fetch teacher workload limits
  const workloadMap = new Map<string, { maxDay: number; maxWeek: number }>();
  if (respectWorkload) {
    const workloads = await prisma.teacherWorkload.findMany({
      where: { schoolId, status: RecordStatus.ACTIVE }
    });
    for (const w of workloads) {
      workloadMap.set(w.teacherId, {
        maxDay: w.maxPeriodsPerDay,
        maxWeek: w.maxPeriodsPerWeek
      });
    }
  }

  // Track teacher assignments per day to enforce workload
  const teacherDayCount = new Map<string, number>();
  const teacherWeekCount = new Map<string, number>();

  const timeSlots = generateTimeSlots();
  const created: Array<{ classId: string; className: string; subjectName: string; dayOfWeek: TimetableDay; startTime: string }> = [];

  for (const classRecord of classes) {
    const classAssignments = assignmentsByClass.get(classRecord.id) ?? [];
    if (classAssignments.length === 0) continue;

    // Fetch subject details for periodsPerWeek
    const subjectNames = classAssignments.map(a => a.subjectName);
    const subjects = await prisma.subject.findMany({
      where: {
        levelId: classRecord.levelId,
        name: { in: subjectNames, mode: "insensitive" }
      }
    });

    const subjectPeriodsPerWeek = new Map<string, number>();
    for (const subject of subjects) {
      subjectPeriodsPerWeek.set(subject.name.toLowerCase(), subject.periodsPerWeek ?? 5);
    }

    // Calculate total periods needed per week for this class
    const periodsPerWeek = classAssignments.reduce((sum, a) => {
      return sum + (subjectPeriodsPerWeek.get(a.subjectName.toLowerCase()) ?? 5);
    }, 0);

    if (periodsPerWeek === 0) continue;

    // Distribute periods across days
    const periodsPerDay = Math.ceil(periodsPerWeek / SCHOOL_DAYS.length);
    let periodIndex = 0;

    for (const dayOfWeek of SCHOOL_DAYS) {
      let dayPeriodCount = 0;

      // Shuffle assignments for variety
      const shuffledAssignments = [...classAssignments].sort(() => Math.random() - 0.5);

      for (const assignment of shuffledAssignments) {
        if (dayPeriodCount >= periodsPerDay && periodsPerWeek > SCHOOL_DAYS.length) break;
        const periodsForSubject = subjectPeriodsPerWeek.get(assignment.subjectName.toLowerCase()) ?? 5;
        if (periodsForSubject <= 0) continue;

        // Find an available time slot
        for (const slot of timeSlots) {
          if (periodIndex >= timeSlots.length) break;
          const slotIndex = periodIndex % timeSlots.length;
          const currentSlot = timeSlots[slotIndex];
          if (!currentSlot) continue;

          // Check teacher workload
          if (respectWorkload) {
            const dayCount = (teacherDayCount.get(`${assignment.teacherId}:${dayOfWeek}`) ?? 0);
            const weekCount = (teacherWeekCount.get(assignment.teacherId) ?? 0);
            const limits = workloadMap.get(assignment.teacherId);
            if (limits) {
              if (dayCount >= limits.maxDay || weekCount >= limits.maxWeek) continue;
            }
          }

          try {
            await prisma.timetablePeriod.create({
              data: {
                schoolId,
                classId: classRecord.id,
                subjectId: subjects.find(
                  s => s.name.toLowerCase() === assignment.subjectName.toLowerCase()
                )?.id ?? "",
                teacherId: assignment.teacherId,
                academicYearId,
                termId,
                dayOfWeek,
                startTime: currentSlot.startTime,
                endTime: currentSlot.endTime,
                shift,
                status: RecordStatus.ACTIVE
              }
            });

            teacherDayCount.set(
              `${assignment.teacherId}:${dayOfWeek}`,
              (teacherDayCount.get(`${assignment.teacherId}:${dayOfWeek}`) ?? 0) + 1
            );
            teacherWeekCount.set(
              assignment.teacherId,
              (teacherWeekCount.get(assignment.teacherId) ?? 0) + 1
            );

            created.push({
              classId: classRecord.id,
              className: classRecord.name,
              subjectName: assignment.subjectName,
              dayOfWeek,
              startTime: currentSlot.startTime
            });

            dayPeriodCount++;
            periodIndex++;
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
              continue;
            }
            throw error;
          }
          break;
        }

        if (periodIndex >= timeSlots.length) break;
      }
    }
  }

  return {
    created: created.length,
    entries: created
  };
}
