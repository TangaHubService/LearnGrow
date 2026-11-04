import type { NotificationType } from "@prisma/client";
import { prisma } from "../../prisma/client.js";

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  schoolId?: string;
  metadata?: Record<string, unknown>;
}

interface DeliveryLog {
  channel: "email" | "sms" | "push" | "in_app";
  status: "sent" | "failed" | "queued";
  error?: string;
}

export async function sendInAppNotification(payload: NotificationPayload): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
    },
  });
}

export async function sendNotification(
  payload: NotificationPayload,
  channels: ("email" | "sms" | "push")[] = []
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
        await sendSmsNotification(payload);
        logs.push({ channel: "sms", status: "sent" });
      } else if (channel === "push") {
        await sendPushNotification(payload);
        logs.push({ channel: "push", status: "sent" });
      }
    } catch (error) {
      logs.push({
        channel,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: payload.userId,
      schoolId: payload.schoolId,
      action: "NOTIFICATION_SENT",
      entityType: "Notification",
      metadata: {
        title: payload.title,
        type: payload.type,
        channels: logs,
      } as any,
    },
  });

  return logs;
}

async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { email: true },
  });
  if (!user?.email) throw new Error("User has no email");

  const { sendStaffInvitationEmail } = await import("../email.service.js");
  await sendStaffInvitationEmail({
    staffName: payload.title,
    schoolName: "KuraLearn",
    role: "User",
    email: user.email,
    tempPassword: undefined,
    setupLink: undefined,
  });
}

async function sendSmsNotification(_payload: NotificationPayload): Promise<void> {
  if (!process.env.SMS_API_KEY) {
    console.warn("[SMS] No SMS provider configured. Would send SMS.");
    return;
  }
}

async function sendPushNotification(_payload: NotificationPayload): Promise<void> {
  if (!process.env.FCM_SERVER_KEY) {
    console.warn("[Push] No FCM configured. Would send push notification.");
    return;
  }
}

export async function getNotificationPreferences(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      parent: { select: { notificationPreference: true } },
    },
  });
  return {
    email: true,
    sms: false,
    push: true,
    inApp: true,
    parentPreference: user?.parent?.notificationPreference ?? "email",
  };
}

export async function notifyAttendanceAlert(
  studentId: string,
  schoolId: string,
  status: string,
  date: Date
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true } },
      parents: { include: { parent: { include: { user: true } } } },
    },
  });

  if (!student) return;

  for (const sp of student.parents) {
    await sendNotification({
      userId: sp.parent.userId,
      title: "Attendance Alert",
      body: `${student.user?.name} was marked ${status} on ${date.toISOString().split("T")[0]}`,
      type: "ATTENDANCE",
      schoolId,
      metadata: { studentId, status, date: date.toISOString() },
    }, ["in_app", sp.parent.notificationPreference === "sms" ? "sms" : "email"].filter(Boolean) as any);
  }
}

export async function notifyPerformanceAlert(
  studentId: string,
  schoolId: string,
  subjectName: string,
  score: number
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true } },
      parents: { include: { parent: { include: { user: true } } } },
    },
  });

  if (!student) return;

  for (const sp of student.parents) {
    await sendNotification({
      userId: sp.parent.userId,
      title: "Performance Update",
      body: `${student.user?.name} scored ${score}% in ${subjectName}`,
      type: "LEARNING_PROGRESS",
      schoolId,
      metadata: { studentId, subjectName, score },
    });
  }
}
