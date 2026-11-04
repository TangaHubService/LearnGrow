import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { StudentService } from './student.service.js';
import { getAuthenticatedUser } from '../../middleware/auth.js';
import { AppError } from '../../http/errors.js';

const linkLearnerSchema = z.object({
  email: z.string().email(),
  classId: z.string().uuid()
});

const linkParentSchema = z.object({
  email: z.string().email(),
  relationship: z.enum(['MOTHER', 'FATHER', 'GUARDIAN']).default('GUARDIAN')
});

function sendStudentError(res: Response, error: unknown, fallback: string) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
  return res.status(500).json({ success: false, error: fallback });
}

function queryValue(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

export class StudentController {
  static async scopedSchoolId(req: Request) {
    const user = getAuthenticatedUser(req);
    return StudentService.resolveSchoolScope(user.sub, user.roles, queryValue(req.query.schoolId));
  }

  static async register(req: Request, res: Response) {
    try {
      const schoolId = await StudentController.scopedSchoolId(req);
      const student = await StudentService.registerStudent({
        ...req.body,
        ...(schoolId && { schoolId })
      });
      res.status(201).json({ success: true, data: student });
    } catch (error: any) {
      console.error('[StudentController.register] Error:', error);
      sendStudentError(res, error, 'Failed to register student');
    }
  }

  static async linkLearner(req: Request, res: Response) {
    try {
      const body = linkLearnerSchema.safeParse(req.body);
      if (!body.success) {
        return res.status(400).json({
          success: false,
          error: "Enter a valid email and choose a class",
          code: "VALIDATION_ERROR"
        });
      }
      const user = getAuthenticatedUser(req);
      const schoolId = await StudentController.scopedSchoolId(req);
      if (!schoolId) throw new AppError(400, "A school is required", "SCHOOL_CONTEXT_REQUIRED");
      const data = await StudentService.linkLearner({
        ...body.data,
        schoolId,
        actorId: user.sub,
        actorRole: user.roles[0] as UserRole
      });
      res.json({ success: true, data });
    } catch (error) {
      sendStudentError(res, error, 'Failed to link learner');
    }
  }

  /** The school office acting on one of its own learners. */
  static async officeScope(req: Request) {
    const user = getAuthenticatedUser(req);
    const schoolId = await StudentController.scopedSchoolId(req);
    if (!schoolId) throw new AppError(400, "A school is required", "SCHOOL_CONTEXT_REQUIRED");
    const studentId = req.params.id as string;
    await StudentService.assertStudentInScope(studentId, schoolId);
    return { studentId, schoolId, actorId: user.sub, actorRole: user.roles[0] as UserRole };
  }

  static async linkParent(req: Request, res: Response) {
    try {
      const body = linkParentSchema.safeParse(req.body);
      if (!body.success) {
        return res.status(400).json({ success: false, error: "Enter a valid email", code: "VALIDATION_ERROR" });
      }
      const scope = await StudentController.officeScope(req);
      res.status(201).json({ success: true, data: await StudentService.linkParent({ ...body.data, ...scope }) });
    } catch (error) {
      sendStudentError(res, error, 'Failed to link parent');
    }
  }

  static async unlinkParent(req: Request, res: Response) {
    try {
      const scope = await StudentController.officeScope(req);
      await StudentService.unlinkParent({ ...scope, parentId: req.params.parentId as string });
      res.json({ success: true });
    } catch (error) {
      sendStudentError(res, error, 'Failed to remove parent');
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const schoolId = await StudentController.scopedSchoolId(req);
      const students = await StudentService.getStudents({
        ...req.query,
        ...(schoolId && { schoolId })
      });
      res.json({ success: true, ...students });
    } catch (error: any) {
      console.error('[StudentController.list] Error:', error);
      sendStudentError(res, error, 'Failed to fetch students');
    }
  }

  static async getDetails(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const schoolId = await StudentController.scopedSchoolId(req);
      await StudentService.assertStudentInScope(id, schoolId);
      const student = await StudentService.getStudentDetails(id);
      res.json({ success: true, data: student });
    } catch (error: any) {
      console.error('[StudentController.getDetails] Error:', error);
      sendStudentError(res, error, 'Failed to fetch student details');
    }
  }

  static async promote(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const schoolId = await StudentController.scopedSchoolId(req);
      await StudentService.assertStudentInScope(id, schoolId);
      const promotion = await StudentService.promoteStudent(id, {
        ...req.body,
        ...(schoolId && { schoolId })
      });
      res.json({ success: true, data: promotion });
    } catch (error: any) {
      console.error('[StudentController.promote] Error:', error);
      sendStudentError(res, error, 'Failed to promote student');
    }
  }

  static async transfer(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const schoolId = await StudentController.scopedSchoolId(req);
      await StudentService.assertStudentInScope(id, schoolId);
      const transfer = await StudentService.transferStudent(id, {
        ...req.body,
        ...(schoolId && { fromSchoolId: schoolId })
      });
      res.json({ success: true, data: transfer });
    } catch (error: any) {
      console.error('[StudentController.transfer] Error:', error);
      sendStudentError(res, error, 'Failed to transfer student');
    }
  }

  static async archive(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const schoolId = await StudentController.scopedSchoolId(req);
      await StudentService.assertStudentInScope(id, schoolId);
      const student = await StudentService.archiveStudent(id);
      res.json({ success: true, data: student });
    } catch (error: any) {
      console.error('[StudentController.archive] Error:', error);
      sendStudentError(res, error, 'Failed to archive student');
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const schoolId = await StudentController.scopedSchoolId(req);
      await StudentService.assertStudentInScope(id, schoolId);
      await StudentService.deleteStudent(id);
      res.json({ success: true, message: 'Student record deleted permanently' });
    } catch (error: any) {
      console.error('[StudentController.delete] Error:', error);
      sendStudentError(res, error, 'Failed to delete student');
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const schoolId = await StudentController.scopedSchoolId(req);
      await StudentService.assertStudentInScope(id, schoolId);
      const student = await StudentService.updateStudent(id, {
        ...req.body,
        ...(schoolId && { schoolId })
      });
      res.json({ success: true, data: student });
    } catch (error: any) {
      console.error('[StudentController.update] Error:', error);
      sendStudentError(res, error, 'Failed to update student');
    }
  }
}
