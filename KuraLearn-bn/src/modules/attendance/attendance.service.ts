import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";
import { AttendanceStatus, Gender, LearnerRiskLevel, NotificationType, UserRole } from "@prisma/client";
import { addNotification } from "../platform/platform.service.js";
import { runTeacherAi, TEACHER_AI_SYSTEM_PROMPT, callOpenAIJson } from "../ai/ai.service.js";

const ATTENDANCE_AI_PROMPT = `
You are the KuraLearn AI Attendance Analyst. Your goal is to analyze school attendance patterns and provide actionable insights.
Identify at-risk students based on consecutive absences or declining rates.
Suggest interventions for teachers and summaries for parents.
Predict chronic absenteeism using historical trends.
`;

export async function markAttendance(userId: string, data: {
  schoolId: string;
  classId: string;
  date: string;
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    reason?: string;
  }>;
  lessonId?: string;
  subjectId?: string;
  academicYearId?: string;
  termId?: string;
}) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  // If not a teacher, check if they are an admin
  if (!teacher) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      throw new AppError(403, "Only teachers or admins can mark attendance", "UNAUTHORIZED");
    }

  }

  console.log(`[Attendance] Marking for class ${data.classId} on ${data.date} by user ${userId}`);

  // Validate teacher assignment or same-school membership
  if (teacher) {
    const targetClass = await prisma.class.findUnique({
      where: { id: data.classId }
    });
    
    const assignment = await prisma.teacherClassAssignment.findFirst({
      where: { teacherId: teacher.id, classId: data.classId }
    });
    
    if (!assignment && targetClass && targetClass.schoolId !== teacher.schoolId) {
      throw new AppError(403, "You do not have permission to mark attendance for this school's class", "UNAUTHORIZED");
    }
  }

  const attendanceDate = new Date(data.date);
  attendanceDate.setHours(0, 0, 0, 0);

  const results = await Promise.all(data.records.map(async (record) => {
    try {
      const existing = await prisma.attendanceRecord.findFirst({
        where: {
          studentId: record.studentId,
          date: attendanceDate,
          lessonId: data.lessonId || null
        }
      });

      let upserted;
      if (existing) {
        upserted = await prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: {
            status: record.status,
            reason: record.reason,
            subjectId: data.subjectId,
            academicYearId: data.academicYearId,
            termId: data.termId,
            teacherId: teacher?.id || "SYSTEM",
            updatedById: userId
          }
        });
      } else {
        upserted = await prisma.attendanceRecord.create({
          data: {
            schoolId: data.schoolId || teacher?.schoolId || "",
            classId: data.classId,
            studentId: record.studentId,
            teacherId: teacher?.id || "SYSTEM",
            date: attendanceDate,
            status: record.status,
            reason: record.reason,
            lessonId: data.lessonId,
            subjectId: data.subjectId,
            academicYearId: data.academicYearId,
            termId: data.termId,
            createdById: userId,
            markedBy: teacher?.id || null
          }
        });
      }

      // Trigger notification for Absent/Late
      if (record.status === "ABSENT" || record.status === "LATE") {
        await triggerParentNotification(record.studentId, record.status, attendanceDate);
      }

      return upserted;
    } catch (err: any) {
      console.error(`[Attendance] Failed to mark record for student ${record.studentId}: ${err.message}`);
      throw err;
    }
  }));

  // Update analytics after marking
  await updateAttendanceAnalytics(data.schoolId, data.classId, attendanceDate);

  return results;
}

async function triggerParentNotification(studentId: string, status: string, date: Date) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true, parents: { include: { parent: { include: { user: true } } } } }
  });

  if (!student) return;

  const dateStr = date.toLocaleDateString();
  const message = `Your child ${student.user.name} was marked ${status.toLowerCase()} today (${dateStr}). Please contact the school if this is incorrect.`;

  for (const sp of student.parents) {
    if (sp.parent.user) {
      await addNotification(sp.parent.user.id, `Attendance Alert: ${status}`, message, NotificationType.ATTENDANCE);
      // In a real app, send SMS here using a provider
      console.log(`[SMS] Sending to ${sp.parent.phone}: ${message}`);
    }
  }
}

export async function updateAttendanceAnalytics(schoolId: string, classId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const { students, records } = await getAttendanceDataSet({
    schoolId,
    classId,
    startDate: startOfDay.toISOString(),
    endDate: startOfDay.toISOString()
  });

  if (students.length === 0 && records.length === 0) return;

  const stats = {
    present: records.filter(r => r.status === "PRESENT").length,
    absent: records.filter(r => r.status === "ABSENT").length,
    late: records.filter(r => r.status === "LATE").length,
    excused: records.filter(r => r.status === "EXCUSED").length,
    total: students.length
  };

  const attendanceRate = stats.total > 0 ? ((stats.present + stats.late) / stats.total) * 100 : 0;

  // Disability breakdown
  const recordsByStudentId = new Map(records.map(record => [record.studentId, record]));

  const genderStats = students.reduce((acc: any, s) => {
    const record = recordsByStudentId.get(s.id);
    const gender = s.gender || "UNKNOWN";
    if (!acc[gender]) acc[gender] = { present: 0, total: 0 };
    acc[gender].total++;
    if (record?.status === "PRESENT") acc[gender].present++;
    return acc;
  }, {});

  const disabilityStats = students.reduce((acc: any, s) => {
    const record = recordsByStudentId.get(s.id);
    const category = s.hasDisability ? (s.disabilityType || "OTHER") : "NONE";
    if (!acc[category]) acc[category] = { present: 0, total: 0 };
    acc[category].total++;
    if (record?.status === "PRESENT") acc[category].present++;
    return acc;
  }, {});

  await prisma.attendanceAnalytics.upsert({
    where: { id: `DAILY_${classId}_${startOfDay.getTime()}` },
    create: {
      id: `DAILY_${classId}_${startOfDay.getTime()}`,
      schoolId,
      classId,
      date: startOfDay,
      period: "DAILY",
      presentCount: stats.present,
      absentCount: stats.absent,
      lateCount: stats.late,
      excusedCount: stats.excused,
      totalStudents: stats.total,
      attendanceRate,
      metadata: { genderStats, disabilityStats }
    },
    update: {
      presentCount: stats.present,
      absentCount: stats.absent,
      lateCount: stats.late,
      excusedCount: stats.excused,
      totalStudents: stats.total,
      attendanceRate,
      metadata: { genderStats, disabilityStats }
    }
  });
}

export async function getAnalytics(schoolId: string, filters: { classId?: string; startDate?: string; endDate?: string }) {
  if (!schoolId) throw new AppError(400, "Missing schoolId", "MISSING_SCHOOL_ID");
  const where: any = { schoolId };
  if (filters.classId) where.classId = filters.classId;
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) where.date.lte = new Date(filters.endDate);
  }

  return prisma.attendanceAnalytics.findMany({
    where,
    orderBy: { date: "asc" }
  });
}

export async function getStudentRisk(studentId: string) {
  return prisma.studentRiskScore.findUnique({
    where: { studentId }
  });
}

export async function getAttendanceAlerts(schoolId: string, studentId?: string) {
  return prisma.attendanceAlert.findMany({
    where: { schoolId, studentId, resolved: false },
    orderBy: { createdAt: "desc" },
    include: { student: { include: { user: true } } }
  });
}

export async function calculateStudentRiskAI(userId: string, studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      assessmentSubmissions: { take: 10, orderBy: { createdAt: "desc" } },
      promotions: { take: 5, orderBy: { createdAt: "desc" } }
    }
  });

  if (!student) throw new AppError(404, "Student not found", "STUDENT_NOT_FOUND");

  const attendance = await prisma.attendanceRecord.findMany({
    where: { studentId },
    orderBy: { date: "desc" },
    take: 30
  });

  const promptLines = [
    `Analyze student: ${student.user.name}`,
    `Recent Attendance: ${JSON.stringify(attendance.map(a => ({ date: a.date, status: a.status })))}`,
    `Recent Performance: ${JSON.stringify(student.assessmentSubmissions.map(s => ({ score: s.score, status: s.status })))}`,
    "Identify if student is at risk of dropout or chronic absenteeism. Provide risk level (LOW, MEDIUM, HIGH), score (0.0-1.0), and factors."
  ];

  const format = {
    type: "json_schema",
    name: "attendance_risk_score",
    strict: true,
    schema: {
      type: "object",
      properties: {
        riskLevel: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
        score: { type: "number" },
        factors: { type: "array", items: { type: "string" } },
        predictions: { type: "object", properties: { dropoutRisk: { type: "string" }, chronicAbsenteeism: { type: "string" } }, required: ["dropoutRisk", "chronicAbsenteeism"], additionalProperties: false }
      },
      required: ["riskLevel", "score", "factors", "predictions"],
      additionalProperties: false
    }
  };

  const result = await callOpenAIJson<any>({
    userId,
    feature: "attendance.risk_scoring",
    prompt: promptLines.join("\n"),
    format,
    instructions: ATTENDANCE_AI_PROMPT,
    fallback: {
      riskLevel: "LOW",
      score: 0.1,
      factors: ["Insufficient data"],
      predictions: { dropoutRisk: "Unknown", chronicAbsenteeism: "Unknown" }
    }
  });

  return prisma.studentRiskScore.upsert({
    where: { studentId },
    create: {
      studentId,
      riskLevel: result.riskLevel as LearnerRiskLevel,
      score: result.score,
      factors: result.factors,
      predictions: result.predictions,
      lastCalculated: new Date()
    },
    update: {
      riskLevel: result.riskLevel as LearnerRiskLevel,
      score: result.score,
      factors: result.factors,
      predictions: result.predictions,
      lastCalculated: new Date()
    }
  });
}

export async function generateSmartSuggestions(userId: string, role: UserRole, context: { schoolId: string, classId?: string, studentId?: string }) {
  if (!context.classId || !context.schoolId) {
    return [
      {
        title: "Start by selecting a class",
        message: "AI insights require a specific class context to analyze attendance records and patterns.",
        action: "Select a class from the top dropdown to view tailored attendance intelligence.",
        priority: "LOW"
      }
    ];
  }

  try {
    const classObj = await prisma.class.findUnique({
      where: { id: context.classId },
      select: { name: true }
    });

    const students = await prisma.student.findMany({
      where: { classId: context.classId },
      include: { user: { select: { name: true } } }
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const records30 = await prisma.attendanceRecord.findMany({
      where: {
        classId: context.classId,
        date: { gte: thirtyDaysAgo }
      }
    });

    const className = classObj?.name || "This class";

    // 1. If no records at all
    if (records30.length === 0) {
      return [
        {
          title: `No attendance records found for ${className} in the last 30 days.`,
          message: "AI-powered analytics require actual daily attendance marks to evaluate trends and patterns.",
          action: "Start marking daily attendance in the Attendance List tab to unlock AI insights.",
          priority: "LOW"
        }
      ];
    }

    // 2. Weekly Trends (This Week vs. Last Week)
    const recordsThisWeek = records30.filter(r => new Date(r.date) >= sevenDaysAgo);
    const recordsLastWeek = records30.filter(r => new Date(r.date) >= fourteenDaysAgo && new Date(r.date) < sevenDaysAgo);

    const totalThisWeek = recordsThisWeek.length;
    const presentThisWeek = recordsThisWeek.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
    const rateThisWeek = totalThisWeek > 0 ? (presentThisWeek / totalThisWeek) * 100 : 0;

    const totalLastWeek = recordsLastWeek.length;
    const presentLastWeek = recordsLastWeek.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
    const rateLastWeek = totalLastWeek > 0 ? (presentLastWeek / totalLastWeek) * 100 : 0;

    const trendDrop = rateLastWeek > rateThisWeek ? Math.round(rateLastWeek - rateThisWeek) : 0;
    const trendIncrease = rateThisWeek > rateLastWeek ? Math.round(rateThisWeek - rateLastWeek) : 0;

    // 3. Repeated Absenteeism (Risky Students)
    const studentAbsences = new Map<string, number>();
    records30.forEach(r => {
      if (r.status === "ABSENT") {
        studentAbsences.set(r.studentId, (studentAbsences.get(r.studentId) || 0) + 1);
      }
    });

    const atRiskStudents = Array.from(studentAbsences.entries())
      .filter(([_, count]) => count >= 2)
      .map(([studentId, count]) => {
        const student = students.find(s => s.id === studentId);
        return { name: student?.user.name || "Unknown Student", count };
      })
      .sort((a, b) => b.count - a.count);

    // 4. Gender Comparison (30 Days)
    const boys = students.filter(s => s.gender === "MALE");
    const girls = students.filter(s => s.gender === "FEMALE");
    const boyIds = boys.map(b => b.id);
    const girlIds = girls.map(g => g.id);

    const boyRecords = records30.filter(r => boyIds.includes(r.studentId));
    const girlRecords = records30.filter(r => girlIds.includes(r.studentId));

    const totalBoy = boyRecords.length;
    const presentBoy = boyRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
    const boysRate30 = totalBoy > 0 ? Math.round((presentBoy / totalBoy) * 100) : 0;

    const totalGirl = girlRecords.length;
    const presentGirl = girlRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
    const girlsRate30 = totalGirl > 0 ? Math.round((presentGirl / totalGirl) * 100) : 0;

    // 5. School Comparisons
    const schoolRecords30 = await prisma.attendanceRecord.findMany({
      where: {
        schoolId: context.schoolId,
        date: { gte: thirtyDaysAgo }
      }
    });

    const totalSchool = schoolRecords30.length;
    const presentSchool = schoolRecords30.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
    const schoolAverageRate = totalSchool > 0 ? Math.round((presentSchool / totalSchool) * 100) : 90;

    const schoolClasses = await prisma.class.findMany({
      where: { schoolId: context.schoolId },
      select: { id: true, name: true }
    });

    const classRates = schoolClasses.map(cls => {
      const clsRecords = schoolRecords30.filter(r => r.classId === cls.id);
      const total = clsRecords.length;
      const present = clsRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return { id: cls.id, name: cls.name, rate, total };
    }).filter(c => c.total > 0);

    const bestClass = classRates.length > 0 ? classRates.sort((a, b) => b.rate - a.rate)[0] : null;

    // 6. Day of Week Patterns
    const weekdayStats: Record<number, { total: number; present: number }> = {
      1: { total: 0, present: 0 }, // Monday
      2: { total: 0, present: 0 }, // Tuesday
      3: { total: 0, present: 0 }, // Wednesday
      4: { total: 0, present: 0 }, // Thursday
      5: { total: 0, present: 0 }  // Friday
    };
    records30.forEach(r => {
      const day = new Date(r.date).getDay();
      if (day >= 1 && day <= 5) {
        const stats = weekdayStats[day];
        if (stats) {
          stats.total += 1;
          if (r.status === "PRESENT" || r.status === "LATE") {
            stats.present += 1;
          }
        }
      }
    });

    const weekdayRates = Object.entries(weekdayStats).map(([dayStr, stats]) => {
      const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
      return { day: parseInt(dayStr), rate, total: stats.total };
    }).filter(w => w.total > 0);

    const lowestDay = weekdayRates.length > 0 ? weekdayRates.sort((a, b) => a.rate - b.rate)[0] : null;

    // Compile deterministic database suggestions first (acts as highly robust fallback)
    const computedSuggestions = [];

    // Trend
    if (trendDrop >= 5) {
      computedSuggestions.push({
        title: `${className} attendance dropped by ${trendDrop}% this week compared to last week.`,
        message: `Average class attendance fell from ${Math.round(rateLastWeek)}% to ${Math.round(rateThisWeek)}% this week.`,
        action: "Investigate if this drop is localized to specific days or a particular group of students.",
        priority: trendDrop >= 12 ? "HIGH" : "MEDIUM"
      });
    } else if (trendIncrease >= 5) {
      computedSuggestions.push({
        title: `${className} attendance improved by ${trendIncrease}% this week!`,
        message: `Average class attendance rose from ${Math.round(rateLastWeek)}% to ${Math.round(rateThisWeek)}% this week.`,
        action: "Congratulate the students and continue using positive reinforcement.",
        priority: "LOW"
      });
    } else {
      computedSuggestions.push({
        title: `${className} attendance remains steady at ${Math.round(rateThisWeek)}%.`,
        message: "The class average has remained consistent over the last two weeks.",
        action: "Continue marking attendance daily to maintain accurate trend analysis.",
        priority: "LOW"
      });
    }

    // Repeated absences
    if (atRiskStudents.length > 0) {
      const firstAtRisk = atRiskStudents[0];
      const nameOfFirst = firstAtRisk ? firstAtRisk.name : "flagged students";
      const names = atRiskStudents.slice(0, 3).map(s => s.name).join(", ");
      const andMore = atRiskStudents.length > 3 ? ` and ${atRiskStudents.length - 3} more` : "";
      computedSuggestions.push({
        title: `${atRiskStudents.length} student${atRiskStudents.length > 1 ? "s" : ""} have been absent 2 or more times this month.`,
        message: `${names}${andMore} have been flagged for repeated absenteeism.`,
        action: `Open the student history drawer for ${nameOfFirst} to review missed dates and call parents.`,
        priority: atRiskStudents.length > 3 ? "HIGH" : "MEDIUM"
      });
    } else {
      computedSuggestions.push({
        title: "No repeated absences detected this month.",
        message: "Every student has maintained strong consistency with minimal gaps.",
        action: "Celebrate the high attendance and encourage the class to keep it up!",
        priority: "LOW"
      });
    }

    // Gender
    if (boyRecords.length > 0 || girlRecords.length > 0) {
      const diff = Math.abs(girlsRate30 - boysRate30);
      let message = `Boys attendance is at ${boysRate30}% while Girls attendance is at ${girlsRate30}% over the last 30 days.`;
      let action = "Keep supporting all learners equally.";
      let priority = "LOW";

      if (girlsRate30 > boysRate30 && diff >= 5) {
        message = `Girls attendance (${girlsRate30}%) is ${diff}% higher than Boys (${boysRate30}%) this month.`;
        action = "Identify if any specific boys are driving this drop and provide targeted support.";
        priority = diff >= 10 ? "MEDIUM" : "LOW";
      } else if (boysRate30 > girlsRate30 && diff >= 5) {
        message = `Boys attendance (${boysRate30}%) is ${diff}% higher than Girls (${girlsRate30}%) this month.`;
        action = "Check if female students are experiencing domestic or transportation challenges.";
        priority = diff >= 10 ? "MEDIUM" : "LOW";
      }

      computedSuggestions.push({
        title: `Girls attendance has averaged ${girlsRate30}% over the last 30 days.`,
        message,
        action,
        priority
      });
    }

    // Day of week
    if (lowestDay && lowestDay.rate < 90) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const lowestDayName = days[lowestDay.day];
      computedSuggestions.push({
        title: `${lowestDayName} has the lowest attendance rate across all classes.`,
        message: `${lowestDayName} attendance average is ${lowestDay.rate}% compared to the school average of ${schoolAverageRate}%.`,
        action: `Consider scheduling high-interest lessons, class quizzes, or interactive activities on ${lowestDayName}s to encourage attendance.`,
        priority: "MEDIUM"
      });
    }

    // School class comparisons
    if (bestClass) {
      computedSuggestions.push({
        title: `${bestClass.name} has the best attendance consistency this term.`,
        message: `${bestClass.name} achieved an impressive ${bestClass.rate}% attendance rate over the last 30 days, leading the school.`,
        action: `Share successful engagement strategies used in ${bestClass.name} with other class teachers.`,
        priority: "LOW"
      });
    }

    // OpenAI grounding prompt
    const promptLines = [
      `Generate smart attendance suggestions for class: ${className} (School ID: ${context.schoolId})`,
      `Role: ${role}`,
      "Factual Database Findings:",
      `- Class 30-day average: ${rateThisWeek > 0 ? Math.round(rateThisWeek) : 90}%`,
      `- Previous week average: ${rateLastWeek > 0 ? Math.round(rateLastWeek) : 90}%`,
      `- Trend: ${trendDrop > 0 ? `Dropped by ${trendDrop}%` : trendIncrease > 0 ? `Improved by ${trendIncrease}%` : "Steady"}`,
      `- Chronically Absent Students: ${JSON.stringify(atRiskStudents)}`,
      `- Gender attendance comparison (30-day): Boys ${boysRate30}%, Girls ${girlsRate30}%`,
      `- School average attendance rate: ${schoolAverageRate}%`,
      `- Best performing class in school: ${bestClass ? `${bestClass.name} (${bestClass.rate}%)` : "N/A"}`,
      `- Lowest attendance day of the week: ${lowestDay ? `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][lowestDay.day]} (${lowestDay.rate}%)` : "N/A"}`,
      "",
      "INSTRUCTIONS:",
      "1. You MUST ground all insights STRICTLY in the factual database findings provided above. DO NOT invent other statistics, random percentages, or names.",
      "2. Refine the 4-5 suggestions to make them highly professional, empathetic, and actionable for primary/nursery school teachers.",
      "3. Each suggestion MUST contain specific values from the findings (e.g. mention the exact drop percentage, mention exact student names like Sarah if present in chronological absences, mention the exact day of the week that has the drop).",
      "4. Return exactly a JSON object matching the suggestions schema."
    ];

    const format = {
      type: "json_schema",
      name: "attendance_suggestions",
      strict: true,
      schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                message: { type: "string" },
                action: { type: "string" },
                priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] }
              },
              required: ["title", "message", "action", "priority"],
              additionalProperties: false
            }
          }
        },
        required: ["suggestions"],
        additionalProperties: false
      }
    };

    const result = await callOpenAIJson<any>({
      userId,
      feature: "attendance.suggestions",
      prompt: promptLines.join("\n"),
      format,
      instructions: ATTENDANCE_AI_PROMPT,
      fallback: { suggestions: computedSuggestions }
    });

    // Make sure suggestions are present, if not return computed ones
    if (result && result.suggestions && result.suggestions.length > 0) {
      return result.suggestions;
    }
    return computedSuggestions;
  } catch (error) {
    console.error("[generateSmartSuggestions] Failed", error);
    return [
      {
        title: "Real-time AI analysis is temporarily offline",
        message: "We encountered an issue reading the latest attendance logs from the database.",
        action: "Please retry refreshing this page or contact your school administrator if the issue persists.",
        priority: "LOW"
      }
    ];
  }
}

export async function updateSchoolAttendanceAnalytics(schoolId: string) {
  const classes = await prisma.class.findMany({ where: { schoolId } });
  const results = [];
  
  for (const cls of classes) {
    await updateAttendanceAnalytics(schoolId, cls.id, new Date());
    results.push({ classId: cls.id, status: "updated" });
  }
  
  return results;
}

type AttendanceSummaryBreakdown = {
  total: number;
  boys: number;
  girls: number;
};

type AttendanceDataParams = {
  schoolId: string;
  classId?: string;
  subjectId?: string;
  startDate: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
};

type AttendanceSummaryParams = {
  schoolId: string;
  classId?: string;
  subjectId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
};

function parseAttendanceDate(value: string, field: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `Invalid ${field}`, "INVALID_DATE");
  }
  return date;
}

function normalizeDateRange(params: { date?: string; startDate?: string; endDate?: string; period?: string }) {
  const period = params.period?.toLowerCase();
  if (period && params.date) {
    const ref = new Date(params.date);
    if (!Number.isNaN(ref.getTime())) {
      let start = new Date(ref);
      let end = new Date(ref);
      if (period === "daily") {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (period === "weekly") {
        const day = ref.getDay();
        const diff = ref.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(ref.setDate(diff));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else if (period === "monthly") {
        start = new Date(ref.getFullYear(), ref.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
      } else if (period === "yearly") {
        start = new Date(ref.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(ref.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
      }
      return { start, end };
    }
  }
  const startSource = params.date || params.startDate;
  const endSource = params.date || params.endDate || params.startDate;
  if (!startSource || !endSource) {
    throw new AppError(400, "Missing date or startDate/endDate query parameters", "MISSING_DATE");
  }

  const start = parseAttendanceDate(startSource, params.date ? "date" : "startDate");
  start.setHours(0, 0, 0, 0);
  const end = parseAttendanceDate(endSource, params.date ? "date" : "endDate");
  end.setHours(23, 59, 59, 999);
  if (start > end) throw new AppError(400, "startDate cannot be after endDate", "INVALID_DATE_RANGE");

  return { start, end };
}

function dateKey(value: Date | string) {
  return new Date(value).toISOString().split("T")[0];
}

function recordTimestamp(record: any) {
  return Math.max(
    new Date(record.updatedAt || 0).getTime(),
    new Date(record.markedAt || 0).getTime(),
    new Date(record.createdAt || 0).getTime()
  );
}

function normalizeAttendanceRecords<T extends { studentId: string; date: Date; updatedAt?: Date; markedAt?: Date; createdAt?: Date }>(records: T[]) {
  const byStudentAndDay = new Map<string, T>();

  records.forEach(record => {
    const key = `${record.studentId}:${dateKey(record.date)}`;
    const current = byStudentAndDay.get(key);
    if (!current || recordTimestamp(record) >= recordTimestamp(current)) {
      byStudentAndDay.set(key, record);
    }
  });

  return Array.from(byStudentAndDay.values()).sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    return dateDiff === 0 ? recordTimestamp(b) - recordTimestamp(a) : dateDiff;
  });
}

async function getAttendanceDataSet(params: AttendanceDataParams) {
  if (!params.schoolId) throw new AppError(400, "Missing schoolId", "MISSING_SCHOOL_ID");
  const { start, end } = normalizeDateRange({ startDate: params.startDate, endDate: params.endDate });

  const studentWhere: any = { schoolId: params.schoolId };
  if (params.classId) studentWhere.classId = params.classId;

  if (params.status) {
    const matchingRecords = await prisma.attendanceRecord.findMany({
      where: {
        schoolId: params.schoolId,
        classId: params.classId,
        date: { gte: start, lte: end },
        status: params.status as any
      },
      select: { studentId: true }
    });
    const matchingStudentIds = matchingRecords.map(r => r.studentId);
    studentWhere.id = { in: matchingStudentIds };
  }

  if (params.search) {
    const searchVal = params.search.trim();
    studentWhere.OR = [
      { studentCode: { contains: searchVal, mode: "insensitive" } },
      { user: { name: { contains: searchVal, mode: "insensitive" } } },
      { gender: { contains: searchVal, mode: "insensitive" } }
    ];
  }

  const totalCount = await prisma.student.count({ where: studentWhere });

  const page = params.page ? parseInt(params.page as any) : undefined;
  const limit = params.limit ? parseInt(params.limit as any) : undefined;

  const students = await prisma.student.findMany({
    where: studentWhere,
    include: { user: true },
    orderBy: { user: { name: "asc" } },
    ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {})
  });

  const studentIds = students.map(student => student.id);

  const recordWhere: any = {
    schoolId: params.schoolId,
    date: { gte: start, lte: end },
    studentId: { in: studentIds }
  };
  if (params.classId) recordWhere.classId = params.classId;
  if (params.subjectId) recordWhere.subjectId = params.subjectId;

  const rawRecords = await prisma.attendanceRecord.findMany({
    where: recordWhere,
    orderBy: [
      { date: "asc" },
      { updatedAt: "desc" },
      { markedAt: "desc" },
      { createdAt: "desc" }
    ]
  });

  const records = normalizeAttendanceRecords(rawRecords);

  return { students, records, totalCount, start, end };
}

function emptyBreakdown(): AttendanceSummaryBreakdown {
  return { total: 0, boys: 0, girls: 0 };
}

function addStudentToBreakdown(group: AttendanceSummaryBreakdown, student?: { gender: Gender | null }) {
  group.total += 1;
  if (student?.gender === Gender.MALE) group.boys += 1;
  if (student?.gender === Gender.FEMALE) group.girls += 1;
}

export async function getAttendanceGrid(
  schoolId: string,
  classId: string,
  startDate: string,
  endDate: string,
  subjectId?: string,
  search?: string,
  page?: number,
  limit?: number,
  status?: string
) {
  const { students, records, totalCount } = await getAttendanceDataSet({
    schoolId,
    classId,
    startDate,
    endDate,
    subjectId,
    search,
    page,
    limit,
    status
  });

  return { students, records, totalCount };
}

export async function getAttendanceSummary(params: AttendanceSummaryParams & { period?: string }) {
  const { start, end } = normalizeDateRange(params);
  const { students, records } = await getAttendanceDataSet({
    schoolId: params.schoolId,
    classId: params.classId,
    subjectId: params.subjectId,
    startDate: start.toISOString(),
    endDate: end.toISOString()
  });

  const studentsById = new Map(students.map(student => [student.id, student]));
  const totalStudents = emptyBreakdown();
  students.forEach(student => addStudentToBreakdown(totalStudents, student));

  const statusBreakdown = (status: AttendanceStatus) => {
    const group = emptyBreakdown();
    records
      .filter(record => record.status === status)
      .forEach(record => addStudentToBreakdown(group, studentsById.get(record.studentId)));
    return group;
  };

  const present = statusBreakdown(AttendanceStatus.PRESENT);
  const late = statusBreakdown(AttendanceStatus.LATE);

  const absent = statusBreakdown(AttendanceStatus.ABSENT);
  const excused = statusBreakdown(AttendanceStatus.EXCUSED);

  const totalRecordsBreakdown = emptyBreakdown();
  records.forEach(r => addStudentToBreakdown(totalRecordsBreakdown, studentsById.get(r.studentId)));

  const attendanceRate = totalRecordsBreakdown.total > 0 ? ((present.total + late.total) / totalRecordsBreakdown.total) * 100 : 0;
  const attendanceRateBoys = totalRecordsBreakdown.boys > 0 ? ((present.boys + late.boys) / totalRecordsBreakdown.boys) * 100 : 0;
  const attendanceRateGirls = totalRecordsBreakdown.girls > 0 ? ((present.girls + late.girls) / totalRecordsBreakdown.girls) * 100 : 0;

  return {
    totalStudents,
    present,
    absent,
    late,
    excused,
    totalRecords: records.length,
    attendanceRate,
    attendanceRateBoys,
    attendanceRateGirls,
    hasAttendanceData: records.length > 0
  };
}

export async function getStudentHistory(studentId: string, filters: { startDate?: string; endDate?: string }) {
  const where: any = { studentId };
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) where.date.lte = new Date(filters.endDate);
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      lesson: true,
      subject: true,
      teacher: { include: { user: { select: { name: true } } } }
    }
  });

  // Calculate some stats for the history view
  const total = records.length;
  const present = records.filter(r => r.status === "PRESENT").length;
  const absent = records.filter(r => r.status === "ABSENT").length;
  const late = records.filter(r => r.status === "LATE").length;
  const excused = records.filter(r => r.status === "EXCUSED").length;

  return {
    records,
    summary: {
      total,
      present,
      absent,
      late,
      excused,
      rate: total > 0 ? (present / total) * 100 : 0
    }
  };
}

export async function getAcademicPeriods(schoolId: string) {
  const years = await prisma.academicYear.findMany({
    where: { schoolId, status: "ACTIVE" },
    include: { terms: { where: { status: "ACTIVE" } } },
    orderBy: { startDate: "desc" }
  });

  return years;
}
