import { Request, Response } from "express";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import { StudentService } from "./student.service.js";
import { courseQuerySchema, lessonCompleteSchema, startCourseSchema } from "./student.schemas.js";

export class StudentController {
  static async getMyCourses(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);
    const query = courseQuerySchema.parse(req.query);
    const courses = await StudentService.getMyCourses(user.sub, query);
    res.json({ success: true, courses });
  }

  static async getSubjects(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);
    const subjects = await StudentService.getMySubjects(user.sub);
    res.json({ success: true, subjects });
  }

  static async getCourseDetails(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);
    const courseId = String(req.params.id);
    const course = await StudentService.getCourseDetails(courseId, user.sub);
    res.json({ success: true, course });
  }

  static async startCourse(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);
    const courseId = String(req.params.id);
    const result = await StudentService.startCourse(courseId, user.sub);
    res.json({ success: true, ...result });
  }

  static async completeLesson(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);
    const lessonId = String(req.params.id);
    const data = lessonCompleteSchema.parse(req.body);
    const result = await StudentService.completeLesson(lessonId, user.sub, data);
    res.json({ success: true, ...result });
  }

  static async getContinueLearning(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);
    const result = await StudentService.getContinueLearning(user.sub);
    res.json({ success: true, continueLearning: result });
  }

  static async getDashboard(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);
    const [courses, subjects, continueLearning] = await Promise.all([
      StudentService.getMyCourses(user.sub),
      StudentService.getMySubjects(user.sub),
      StudentService.getContinueLearning(user.sub)
    ]);
    
    res.json({ 
      success: true, 
      dashboard: {
        courses,
        subjects,
        continueLearning
      }
    });
  }
}
