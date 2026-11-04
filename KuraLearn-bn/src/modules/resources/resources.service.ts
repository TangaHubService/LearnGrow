import path from "path";
import { Prisma, RecordStatus, TeacherResourceType, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";
import { storageService } from "../../config/storage.js";

export interface FolderNode {
  id: string;
  name: string;
  type: "class" | "subject" | "course" | "lesson";
  children?: FolderNode[];
  resourceCount: number;
}

// Scoping context helper for general resource requests
async function getResourceContext(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");

  let schoolId: string | null = null;
  let classId: string | null = null;
  let childClassIds: string[] = [];

  if (user.role === UserRole.TEACHER || user.role === UserRole.HEAD_TEACHER) {
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    schoolId = teacher?.schoolId ?? null;
  } else if (user.role === UserRole.STUDENT) {
    const student = await prisma.student.findUnique({ where: { userId } });
    schoolId = student?.schoolId ?? null;
    classId = student?.classId ?? null;
  } else if (user.role === UserRole.PARENT) {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: { students: { include: { student: true } } },
    });
    // In KuraLearn parents might link to multiple students
    const linkedStudents = parent?.students || [];
    childClassIds = linkedStudents
      .map((s) => s.student?.classId)
      .filter(Boolean) as string[];
    schoolId = linkedStudents[0]?.student?.schoolId ?? null;
  }

  // Head teachers, admins and other staff get their school from their staff record.
  if (!schoolId) {
    const staff = await prisma.staff.findUnique({ where: { userId }, select: { schoolId: true } });
    schoolId = staff?.schoolId ?? null;
  }

  // Only a super admin, who has no school of their own, falls back to the first school.
  if (!schoolId && user.role === UserRole.SUPER_ADMIN) {
    schoolId = (await prisma.school.findFirst())?.id ?? null;
  }
  if (!schoolId) throw new AppError(404, "School context not found", "SCHOOL_NOT_FOUND");

  return { user, schoolId, classId, childClassIds };
}

// Scoped filter where clauses based on role permissions
function getRoleResourceWhere(ctx: Awaited<ReturnType<typeof getResourceContext>>): Prisma.TeacherResourceWhereInput {
  const { user, schoolId, classId, childClassIds } = ctx;

  const baseFilter: Prisma.TeacherResourceWhereInput = {
    schoolId,
    status: RecordStatus.ACTIVE,
  };

  // 1. Admin/Super Admin see everything
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return baseFilter;
  }

  // 2. Head Teacher sees everything in school
  if (user.role === UserRole.HEAD_TEACHER) {
    return baseFilter;
  }

  // 3. Teacher sees their own resources, or any public resources in the school, or class-scoped ones
  if (user.role === UserRole.TEACHER) {
    return {
      ...baseFilter,
      OR: [
        { ownerId: user.id },
        { sharedScope: "PUBLIC" },
        { sharedScope: "STUDENTS" },
      ],
    };
  }

  // 4. Student sees public resources or resources assigned to their specific class
  if (user.role === UserRole.STUDENT) {
    return {
      ...baseFilter,
      OR: [
        { sharedScope: "PUBLIC" },
        {
          AND: [
            { sharedScope: "STUDENTS" },
            { OR: [{ classId: null }, { classId }] },
          ],
        },
      ],
    };
  }

  // 5. Parent sees resources shared with parents/students/public linked to child classes
  if (user.role === UserRole.PARENT) {
    return {
      ...baseFilter,
      OR: [
        { sharedScope: "PUBLIC" },
        {
          AND: [
            { sharedScope: { in: ["PARENTS", "STUDENTS"] } },
            { OR: [{ classId: null }, { classId: { in: childClassIds } }] },
          ],
        },
      ],
    };
  }

  return { ...baseFilter, id: "__no_access__" };
}

export async function listResources(
  userId: string,
  query: {
    search?: string;
    classId?: string;
    subjectId?: string;
    courseId?: string;
    lessonId?: string;
    type?: string;
    page: number;
    limit: number;
  }
) {
  const ctx = await getResourceContext(userId);
  const roleWhere = getRoleResourceWhere(ctx);

  const where: Prisma.TeacherResourceWhereInput = {
    AND: [
      roleWhere,
      {
        ...(query.classId && { classId: query.classId }),
        ...(query.subjectId && { subjectId: query.subjectId }),
        ...(query.courseId && { courseId: query.courseId }),
        ...(query.lessonId && { lessonId: query.lessonId }),
        ...(query.type && { type: query.type as TeacherResourceType }),
        ...(query.search && {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
            { topic: { contains: query.search, mode: "insensitive" } },
            { tags: { has: query.search } },
          ],
        }),
      },
    ],
  };

  const skip = (query.page - 1) * query.limit;
  const take = query.limit;

  const [items, total] = await Promise.all([
    prisma.teacherResource.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        course: { select: { id: true, title: true } },
        lesson: { select: { id: true, title: true } },
        owner: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.teacherResource.count({ where }),
  ]);

  return {
    items,
    meta: {
      page: query.page,
      pageSize: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getResourceDetails(userId: string, id: string) {
  const ctx = await getResourceContext(userId);
  const roleWhere = getRoleResourceWhere(ctx);

  const resource = await prisma.teacherResource.findFirst({
    where: {
      AND: [{ id }, roleWhere],
    },
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      course: { select: { id: true, title: true } },
      lesson: { select: { id: true, title: true } },
      owner: { select: { id: true, name: true, role: true } },
    },
  });

  if (!resource) throw new AppError(404, "Resource not found or unauthorized", "RESOURCE_NOT_FOUND");
  return resource;
}

function isAllowedFileType(file: Express.Multer.File): boolean {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  const allowedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
    ".mp3",
    ".wav",
    ".m4a",
    ".ogg",
    ".flac",
    ".aac",
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
    ".3gp",
    ".wmv",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return true;
  }

  const mime = file.mimetype.toLowerCase();
  if (mime.startsWith("image/") || mime.startsWith("audio/") || mime.startsWith("video/")) {
    return true;
  }

  const ext = path.extname(file.originalname).toLowerCase();
  return allowedExtensions.includes(ext);
}

export async function uploadResource(
  userId: string,
  file: Express.Multer.File,
  metadata: {
    title: string;
    description?: string;
    type: string;
    classId?: string;
    subjectId?: string;
    courseId?: string;
    lessonId?: string;
    tags?: string[];
    sharedScope?: string;
  }
) {
  const { user, schoolId } = await getResourceContext(userId);

  // Direct permissions check: only Admins, Headteachers, and Teachers can upload
  if (
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.SUPER_ADMIN &&
    user.role !== UserRole.HEAD_TEACHER &&
    user.role !== UserRole.TEACHER
  ) {
    throw new AppError(403, "Only educators are permitted to upload resources", "UPLOAD_FORBIDDEN");
  }

  // Enforce required class, subject, and lesson selection for file uploads
  if (!metadata.classId || !metadata.subjectId || !metadata.lessonId) {
    throw new AppError(
      400,
      "Class, subject, and lesson selection are required to align resources with the curriculum.",
      "VALIDATION_ERROR"
    );
  }

  // Allowed file types check
  if (!isAllowedFileType(file)) {
    throw new AppError(
      400,
      "Invalid file type. Only learning resources (PDF, Word, Excel, PowerPoint, images, audio, video) are allowed.",
      "INVALID_FILE_TYPE"
    );
  }

  // Max size limit validation: 100MB
  if (file.size > 100 * 1024 * 1024) {
    throw new AppError(400, "File size exceeds the 100MB limit", "FILE_TOO_LARGE");
  }

  // Fetch relational database fields to build dynamic path and sync record names
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  const schoolName = school?.name ?? "General";

  const cls = await prisma.class.findUnique({ where: { id: metadata.classId } });
  if (!cls) throw new AppError(400, "Selected class not found", "CLASS_NOT_FOUND");
  const className = cls.name;

  const sub = await prisma.subject.findUnique({ where: { id: metadata.subjectId } });
  if (!sub) throw new AppError(400, "Selected subject not found", "SUBJECT_NOT_FOUND");
  const subjectName = sub.name;

  const les = await prisma.lesson.findUnique({ where: { id: metadata.lessonId } });
  if (!les) throw new AppError(400, "Selected lesson not found", "LESSON_NOT_FOUND");
  const topicName = les.topic ?? les.title;

  // Build structure: School Name / Class Name / Subject Name / Resource Type
  const resourceType = metadata.type || "OTHER";
  const uploadFolder = `${schoolName}/${className}/${subjectName}/${resourceType}`;

  // Upload file
  const uploadResult = await storageService.uploadFile(file, uploadFolder);

  const resource = await prisma.teacherResource.create({
    data: {
      schoolId,
      ownerId: user.id,
      title: metadata.title,
      description: metadata.description,
      type: metadata.type as TeacherResourceType,
      fileSize: file.size,
      fileUrl: uploadResult.secureUrl,
      storageProvider: process.env.STORAGE_PROVIDER || "LOCAL",
      storagePath: uploadResult.storagePath,
      originalName: uploadResult.originalName || file.originalname,
      mimeType: uploadResult.mimeType || file.mimetype,
      googleDriveFileId: uploadResult.googleDriveFileId || null,
      downloadLink: uploadResult.downloadLink || null,
      classId: metadata.classId || null,
      subjectId: metadata.subjectId || null,
      courseId: metadata.courseId || null,
      lessonId: metadata.lessonId || null,
      className: className || null,
      subjectName: subjectName || null,
      topic: topicName || null,
      tags: metadata.tags || [],
      sharedScope: metadata.sharedScope || "STUDENTS",
      createdById: user.id,
      updatedById: user.id,
    },
  });

  return resource;
}

export async function updateResource(
  userId: string,
  id: string,
  metadata: Partial<{
    title: string;
    description: string;
    type: string;
    classId: string;
    subjectId: string;
    courseId: string;
    lessonId: string;
    tags: string[];
    sharedScope: string;
    status: string;
  }>
) {
  const { user } = await getResourceContext(userId);

  const existing = await prisma.teacherResource.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Resource not found", "RESOURCE_NOT_FOUND");

  // Validate owner or admin rights
  if (
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.SUPER_ADMIN &&
    user.role !== UserRole.HEAD_TEACHER &&
    existing.ownerId !== user.id
  ) {
    throw new AppError(403, "You do not have permission to edit this resource", "EDIT_FORBIDDEN");
  }

  // Update fallbacks if structural IDs are changed
  let className: string | undefined;
  let subjectName: string | undefined;
  let topicName: string | undefined;

  if (metadata.classId) {
    const cls = await prisma.class.findUnique({ where: { id: metadata.classId } });
    className = cls?.name;
  }
  if (metadata.subjectId) {
    const sub = await prisma.subject.findUnique({ where: { id: metadata.subjectId } });
    subjectName = sub?.name;
  }
  if (metadata.lessonId) {
    const les = await prisma.lesson.findUnique({ where: { id: metadata.lessonId } });
    topicName = les?.topic ?? les?.title;
  }

  const updated = await prisma.teacherResource.update({
    where: { id },
    data: {
      ...(metadata.title && { title: metadata.title }),
      ...(metadata.description !== undefined && { description: metadata.description }),
      ...(metadata.type && { type: metadata.type as TeacherResourceType }),
      ...(metadata.tags && { tags: metadata.tags }),
      ...(metadata.sharedScope && { sharedScope: metadata.sharedScope }),
      ...(metadata.status && { status: metadata.status as RecordStatus }),
      ...(metadata.classId !== undefined && { classId: metadata.classId }),
      ...(metadata.subjectId !== undefined && { subjectId: metadata.subjectId }),
      ...(metadata.courseId !== undefined && { courseId: metadata.courseId }),
      ...(metadata.lessonId !== undefined && { lessonId: metadata.lessonId }),
      ...(className !== undefined && { className }),
      ...(subjectName !== undefined && { subjectName }),
      ...(topicName !== undefined && { topic: topicName }),
      updatedById: user.id,
    },
  });

  return updated;
}

export async function deleteResource(userId: string, id: string) {
  const { user } = await getResourceContext(userId);

  const existing = await prisma.teacherResource.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Resource not found", "RESOURCE_NOT_FOUND");

  if (
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.SUPER_ADMIN &&
    user.role !== UserRole.HEAD_TEACHER &&
    existing.ownerId !== user.id
  ) {
    throw new AppError(403, "You do not have permission to delete this resource", "DELETE_FORBIDDEN");
  }

  // Delete actual file asset from storage
  if (existing.storagePath) {
    try {
      await storageService.deleteFile(existing.storagePath);
    } catch (err) {
      console.error(`Failed to delete storage asset for resource ${id}:`, err);
    }
  }

  // Delete record from database
  await prisma.teacherResource.delete({ where: { id } });
  return { success: true };
}

// Build hierarchical folder nodes matching active context
export async function getFolders(userId: string): Promise<FolderNode[]> {
  const ctx = await getResourceContext(userId);
  const { schoolId, user } = ctx;
  const roleWhere = getRoleResourceWhere(ctx);

  // Fetch school classes, subjects, courses, and lessons
  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: {
      level: {
        include: {
          subjects: {
            include: {
              courses: {
                include: {
                  lessons: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const folders: FolderNode[] = [];

  for (const cls of classes) {
    const classNode: FolderNode = {
      id: cls.id,
      name: cls.name,
      type: "class",
      children: [],
      resourceCount: 0,
    };

    const subjects = cls.level?.subjects || [];
    for (const sub of subjects) {
      const subjectNode: FolderNode = {
        id: sub.id,
        name: sub.name,
        type: "subject",
        children: [],
        resourceCount: 0,
      };

      const courses = sub.courses || [];
      for (const crs of courses) {
        const courseNode: FolderNode = {
          id: crs.id,
          name: crs.title,
          type: "course",
          children: [],
          resourceCount: 0,
        };

        const lessons = crs.lessons || [];
        for (const les of lessons) {
          // Count files scoped to this lesson
          const lessonResourceCount = await prisma.teacherResource.count({
            where: {
              AND: [
                roleWhere,
                { classId: cls.id, subjectId: sub.id, courseId: crs.id, lessonId: les.id },
              ],
            },
          });

          const lessonNode: FolderNode = {
            id: les.id,
            name: les.title,
            type: "lesson",
            resourceCount: lessonResourceCount,
          };

          courseNode.children!.push(lessonNode);
          courseNode.resourceCount += lessonResourceCount;
        }

        // Count direct files on Course that are not lesson-specific
        const courseResourceCount = await prisma.teacherResource.count({
          where: {
            AND: [
              roleWhere,
              { classId: cls.id, subjectId: sub.id, courseId: crs.id, lessonId: null },
            ],
          },
        });

        courseNode.resourceCount += courseResourceCount;
        subjectNode.children!.push(courseNode);
        subjectNode.resourceCount += courseNode.resourceCount;
      }

      // Count direct files on Subject that are not course-specific
      const subjectResourceCount = await prisma.teacherResource.count({
        where: {
          AND: [
            roleWhere,
            { classId: cls.id, subjectId: sub.id, courseId: null },
          ],
        },
      });

      subjectNode.resourceCount += subjectResourceCount;
      classNode.children!.push(subjectNode);
      classNode.resourceCount += subjectNode.resourceCount;
    }

    // Count direct files on Class that are not subject-specific
    const classResourceCount = await prisma.teacherResource.count({
      where: {
        AND: [
          roleWhere,
          { classId: cls.id, subjectId: null },
        ],
      },
    });

    classNode.resourceCount += classResourceCount;
    folders.push(classNode);
  }

  return folders;
}
