import type { NotificationType } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../prisma/client.js";
import { sendSms, type SmsResult } from "../sms.service.js";

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  schoolId?: string;
  metadata?: Record<string, unknown>;
  /** Shorter text for SMS; falls back to the body. */
  smsText?: string;
}

interface DeliveryLog {
  channel: "email" | "sms" | "push" | "in_app";
  status: "sent" | "failed" | "queued" | "logged" | "skipped";
  error?: string;
}

export async function sendInAppNotification(payload: NotificationPayload): Promise<void> {
  await prisma.notification.create({
    data: { userId: payload.userId, title: payload.title, body: payload.body, type: payload.type },
  });
}

function smsLog(result: SmsResult): DeliveryLog {
  if (result.status === "failed") return { channel: "sms", status: "failed", error: result.error };
  if (result.status === "skipped") return { channel: "sms", status: "skipped", error: result.reason };
  return { channel: "sms", status: result.status };
}

export async function sendNotification(
  payload: NotificationPayload,
  channels: ("email" | "sms" | "push")[] = [],
): Promise<DeliveryLog[]> {
  const logs: DeliveryLog[] = [];

  await sendInAppNotification(payload);
  logs.push({ channel: "in_app", status: "sent" });

  for (const channel of channels) {
    try {
      if (channel === "email") {
        await sendEmailNotification(payload);
        logs.push({ channel: "email", status: "sent" });
      } else if (channel === "sms") {
        logs.push(smsLog(await sendSmsNotification(payload)));
      } else if (channel === "push") {
        // Push is not set up yet; the in-app notification covers it.
        logs.push({ channel: "push", status: "skipped", error: "Push notifications are not configured" });
      }
    } catch (error) {
      logs.push({ channel, status: "failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: payload.userId,
      schoolId: payload.schoolId,
      action: "NOTIFICATION_SENT",
      entityType: "Notification",
      metadata: { title: payload.title, type: payload.type, channels: logs } as any,
    },
  });

  return logs;
}

async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true, name: true } });
  if (!user?.email) throw new Error("User has no email");
  const { sendNotificationEmail } = await import("../email.service.js");
  await sendNotificationEmail({ to: user.email, name: user.name, subject: payload.title, body: payload.body });
}

async function sendSmsNotification(payload: NotificationPayload): Promise<SmsResult> {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { parent: { select: { phone: true } } },
  });
  const phone = user?.parent?.phone;
  return sendSms(phone, payload.smsText ?? payload.body);
}

export async function getNotificationPreferences(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { parent: { select: { notificationPreference: true } } },
  });
  const preference = user?.parent?.notificationPreference ?? "email";
  return {
    email: preference === "email" || preference === "both",
    sms: preference === "sms" || preference === "both",
    push: false,
    inApp: true,
    parentPreference: preference,
  };
}

/** Channels a parent asked for, on top of the in-app notification everyone gets. */
function parentChannels(preference: string | null | undefined): ("email" | "sms")[] {
  if (preference === "sms") return ["sms"];
  if (preference === "both") return ["sms", "email"];
  if (preference === "email") return ["email"];
  return [];
}

const ATTENDANCE_TEXT = {
  rw: {
    ABSENT: (name: string, date: string) =>
      `KuraLearn: ${name} ntiyaje ku ishuri uyu munsi (${date}). Niba atari byo, mwahamagara ishuri.`,
    LATE: (name: string, date: string) =>
      `KuraLearn: ${name} yakererewe kugera ku ishuri uyu munsi (${date}). Niba atari byo, mwahamagara ishuri.`,
  },
  en: {
    ABSENT: (name: string, date: string) =>
      `KuraLearn: ${name} was marked absent from school today (${date}). If this is wrong, please contact the school.`,
    LATE: (name: string, date: string) =>
      `KuraLearn: ${name} was marked late for school today (${date}). If this is wrong, please contact the school.`,
  },
  fr: {
    ABSENT: (name: string, date: string) =>
      `KuraLearn : ${name} a été noté(e) absent(e) aujourd'hui (${date}). En cas d'erreur, contactez l'école.`,
    LATE: (name: string, date: string) =>
      `KuraLearn : ${name} a été noté(e) en retard aujourd'hui (${date}). En cas d'erreur, contactez l'école.`,
  },
};

/**
 * Tell a learner's parents they were marked absent or late: in the app, and by SMS or
 * email when the parent chose that. Errors are logged, never thrown, so saving
 * attendance never fails because a text could not be sent.
 */
export async function notifyParentsOfAttendance(
  studentId: string,
  status: "ABSENT" | "LATE",
  date: Date,
  schoolId?: string,
) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        parents: { include: { parent: { select: { userId: true, notificationPreference: true } } } },
      },
    });
    if (!student) return [];

    const name = student.user?.name ?? "Your child";
    // Use the calendar day as the school sees it (attendance dates are stored at local midnight).
    const day = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
    const text = ATTENDANCE_TEXT[env.SMS_LANGUAGE][status](name, day);
    const englishBody = ATTENDANCE_TEXT.en[status](name, day).replace(/^KuraLearn: /, "");

    const results = [];
    for (const link of student.parents) {
      results.push(
        await sendNotification(
          {
            userId: link.parent.userId,
            title: status === "ABSENT" ? "Attendance alert: absent" : "Attendance alert: late",
            body: englishBody,
            smsText: text,
            type: "ATTENDANCE",
            schoolId: schoolId ?? student.schoolId ?? undefined,
            metadata: { studentId, status, date: day },
          },
          parentChannels(link.parent.notificationPreference),
        ),
      );
    }
    return results;
  } catch (error) {
    console.error("[notify] attendance alert failed:", error);
    return [];
  }
}

export async function notifyPerformanceAlert(studentId: string, schoolId: string, subjectName: string, score: number) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { name: true } }, parents: { include: { parent: true } } },
  });
  if (!student) return;

  for (const link of student.parents) {
    await sendNotification({
      userId: link.parent.userId,
      title: "Performance update",
      body: `${student.user?.name} scored ${score}% in ${subjectName}`,
      type: "LEARNING_PROGRESS",
      schoolId,
      metadata: { studentId, subjectName, score },
    });
  }
}
