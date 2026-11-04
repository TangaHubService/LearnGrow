import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { docsRouter } from "./docs/docs.routes.js";
import { errorHandler, notFoundHandler } from "./http/errors.js";
import { aiRouter } from "./modules/ai/ai.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { superAdminRouter } from "./modules/super-admin/super-admin.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { learningRouter } from "./modules/learning/learning.routes.js";
import { platformRouter } from "./modules/platform/platform.routes.js";
import { teacherRouter } from "./modules/teacher/teacher.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { courseRouter } from "./modules/course/course.routes.js";
import { assessmentRouter } from "./modules/assessment/assessment.routes.js";
import studentRouter from "./modules/student_management/student.routes.js";
import resourcesRouter from "./modules/resources/resources.routes.js";
import { studentRouter as studentLearningRouter } from "./modules/student/student.routes.js";
import { attendanceRouter } from "./modules/attendance/attendance.routes.js";
import { marksRouter } from "./modules/marks/marks.routes.js";
import { headteacherRouter } from "./modules/headteacher/headteacher.routes.js";
import { timetableRouter } from "./modules/timetable/timetable.routes.js";
import { exportRouter } from "./modules/exports/export.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";
import { virtualRouter } from "./modules/virtual/virtual.routes.js";
import { asyncHandler } from "./http/async-handler.js";
import { setupPassword } from "./modules/staff/staff.controller.js";


export function createApp() {
  const app = express();

  // Many services load `user: true`, so password hashes are removed from every JSON response here.
  app.set("json replacer", (key: string, value: unknown) => (key === "passwordHash" ? undefined : value));

  app.use(compression());
  app.use(
    cors({
      origin: [...env.WEB_ORIGINS, env.MOBILE_ORIGIN],
      credentials: true
    })
  );
  app.use("/api-docs", docsRouter);
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use("/uploads", express.static("public/uploads"));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/health", healthRouter);
  app.use("/api/resources", resourcesRouter);
  app.use("/api/v1/resources", resourcesRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/super-admin", superAdminRouter);
  app.use("/api/v1", platformRouter);
  app.use("/api/v1/teacher", teacherRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/learning", learningRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/student-management", studentRouter);
  app.use("/api/v1/student", studentLearningRouter);
  app.use("/api/v1", courseRouter);
  app.use("/api/v1", assessmentRouter);
  app.use("/api/v1/attendance", attendanceRouter);
  app.use("/api/v1", marksRouter);
  app.use("/api/v1/headteacher", headteacherRouter);
  app.use("/api/v1/timetable", timetableRouter);
  app.use("/api/v1/exports", exportRouter);
  app.use("/api/v1/audit", auditRouter);
  app.use("/api/v1/virtual", virtualRouter);

  // Public route — staff password setup via invitation token (no auth required)
  app.post("/api/v1/staff/setup-password", asyncHandler(setupPassword));


  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
