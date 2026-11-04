import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { StudentController } from "./student.controller.js";

export const studentRouter = Router();

// Courses and Subjects
studentRouter.get("/my-courses", requireAuth, asyncHandler(StudentController.getMyCourses));
studentRouter.get("/subjects", requireAuth, asyncHandler(StudentController.getSubjects));
studentRouter.get("/courses/:id", requireAuth, asyncHandler(StudentController.getCourseDetails));
studentRouter.post("/courses/:id/start", requireAuth, asyncHandler(StudentController.startCourse));

// Lessons
studentRouter.post("/lessons/:id/complete", requireAuth, asyncHandler(StudentController.completeLesson));

// Dashboard and Learning Path
studentRouter.get("/dashboard", requireAuth, asyncHandler(StudentController.getDashboard));
studentRouter.get("/continue-learning", requireAuth, asyncHandler(StudentController.getContinueLearning));

export default studentRouter;
