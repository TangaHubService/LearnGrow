import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";
import { LessonStatus, ContentStatus } from "@prisma/client";

export class StudentService {
  /**
   * Get student profile with school, level and class info
   */
  static async getStudent(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        level: true,
        class: true,
        school: true,
        user: true
      }
    });

    if (!student) {
      throw new AppError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    }

    return student;
  }

  /**
   * List courses assigned to the student
   */
  static async getMyCourses(userId: string, filters: any = {}) {
    const student = await this.getStudent(userId);

    const courses = await prisma.course.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        levelId: student.levelId,
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        ...(filters.academicYear && { academicYear: filters.academicYear }),
        // Check for direct enrollment as well as school assignments
        OR: [
          { enrollments: { some: { studentId: student.id } } },
          { schoolId: student.schoolId },
          { schoolId: null }
        ]
      },
      include: {
        subject: true,
        level: true,
        enrollments: {
          where: { studentId: student.id }
        },
        _count: {
          select: { lessons: true }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Map courses to include progress percentage
    return courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      coverImage: course.coverImage,
      academicYear: course.academicYear,
      subject: course.subject,
      level: course.level,
      lessonCount: course._count.lessons,
      progressPercent: course.enrollments[0]?.progressPercent || 0,
      progress: course.enrollments[0]?.progressPercent || 0,
      status: course.enrollments[0]?.completedAt ? 'completed' : (course.enrollments[0] ? 'in_progress' : 'not_started')
    }));
  }

  /**
   * Get subject-level progress
   */
  static async getMySubjects(userId: string) {
    const student = await this.getStudent(userId);

    const subjects = await prisma.subject.findMany({
      where: { levelId: student.levelId },
      include: {
        courses: {
          where: {
            status: ContentStatus.PUBLISHED,
            OR: [
              { schoolId: student.schoolId },
              { schoolId: null }
            ]
          },
          include: {
            lessons: { 
              where: { status: ContentStatus.PUBLISHED },
              select: { id: true } 
            },
            enrollments: {
              where: { studentId: student.id }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    return subjects.map(subject => {
      const allLessons = subject.courses.flatMap(c => c.lessons);
      const enrolledCourses = subject.courses.filter(c => c.enrollments.length > 0);
      const completedCourses = subject.courses.filter(c => c.enrollments[0]?.completedAt);
      
      // Calculate overall progress across all courses in this subject
      // This requires fetching lesson progress for all lessons in these courses
      // For simplicity and performance, we can aggregate enrollment percentages
      const totalProgress = subject.courses.reduce((acc, c) => acc + (c.enrollments[0]?.progressPercent || 0), 0);
      const avgProgress = subject.courses.length > 0 ? Math.round(totalProgress / subject.courses.length) : 0;

      return {
        id: subject.id,
        name: subject.name,
        icon: subject.icon,
        description: subject.description,
        courseCount: subject.courses.length,
        completedCoursesCount: completedCourses.length,
        inProgressCoursesCount: enrolledCourses.length - completedCourses.length,
        pendingCoursesCount: subject.courses.length - enrolledCourses.length,
        progress: avgProgress
      };
    });
  }

  /**
   * Get detailed course info including lessons and their status
   */
  static async getCourseDetails(courseId: string, userId: string) {
    const student = await this.getStudent(userId);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        subject: true,
        level: true,
        units: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { status: ContentStatus.PUBLISHED },
              orderBy: { order: 'asc' },
              include: {
                progress: {
                  where: { studentId: student.id }
                }
              }
            }
          }
        },
        lessons: {
          where: { unitId: null, status: ContentStatus.PUBLISHED }, // standalone lessons
          orderBy: { order: 'asc' },
          include: {
            progress: {
              where: { studentId: student.id }
            }
          }
        },
        enrollments: {
          where: { studentId: student.id }
        }
      }
    });

    if (!course) {
      throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");
    }

    // Check visibility/assignment
    if (course.status !== ContentStatus.PUBLISHED) {
       throw new AppError(403, "This course is not published", "COURSE_UNPUBLISHED");
    }

    const mappedUnits = course.units.map(unit => ({
      ...unit,
      lessons: unit.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        estimatedMinutes: lesson.estimatedMinutes,
        status: lesson.progress[0]?.status || 'NOT_STARTED',
        completedAt: lesson.progress[0]?.completedAt
      }))
    }));

    const mappedStandaloneLessons = course.lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      estimatedMinutes: lesson.estimatedMinutes,
      status: lesson.progress[0]?.status || 'NOT_STARTED',
      completedAt: lesson.progress[0]?.completedAt
    }));

    // For compatibility with some UI components that expect a flat list
    const allLessons = [
      ...mappedUnits.flatMap(u => u.lessons),
      ...mappedStandaloneLessons
    ];

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      subject: course.subject,
      level: course.level,
      progressPercent: course.enrollments[0]?.progressPercent || 0,
      units: mappedUnits,
      standaloneLessons: mappedStandaloneLessons,
      lessons: allLessons
    };
  }

  /**
   * Start learning a course - opens the first incomplete lesson
   */
  static async startCourse(courseId: string, userId: string) {
    const student = await this.getStudent(userId);
    
    // Ensure enrollment exists
    await prisma.courseEnrollment.upsert({
      where: { courseId_studentId: { courseId, studentId: student.id } },
      update: { lastAccessedAt: new Date() },
      create: { courseId, studentId: student.id, lastAccessedAt: new Date() }
    });

    // Find the first incomplete lesson
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          where: { status: ContentStatus.PUBLISHED },
          orderBy: [
            { unit: { order: 'asc' } },
            { order: 'asc' }
          ],
          include: {
            progress: {
              where: { studentId: student.id }
            }
          }
        }
      }
    });

    if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

    const firstIncomplete = course.lessons.find(l => !l.progress[0] || l.progress[0].status !== 'COMPLETED');

    if (!firstIncomplete) {
      // All lessons complete, return course summary or last lesson
      return { completed: true, courseId };
    }

    return { 
      lessonId: firstIncomplete.id, 
      courseId: course.id,
      title: firstIncomplete.title
    };
  }

  /**
   * Mark lesson as completed and update progress
   */
  static async completeLesson(lessonId: string, userId: string, data: { deviceType?: string, timeSpent?: number }) {
    const student = await this.getStudent(userId);
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true }
    });

    if (!lesson) throw new AppError(404, "Lesson not found", "LESSON_NOT_FOUND");

    // Update lesson progress
    const progress = await prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId: student.id, lessonId } },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
        ...(data.timeSpent && { timeSpent: { increment: data.timeSpent } }),
        deviceType: data.deviceType || 'web'
      },
      create: {
        studentId: student.id,
        lessonId,
        status: 'COMPLETED',
        completedAt: new Date(),
        timeSpent: data.timeSpent || 0,
        startedAt: new Date(),
        deviceType: data.deviceType || 'web'
      }
    });

    // Update course progress
    await this.updateCourseProgress(lesson.courseId, student.id);

    // Get next lesson
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        courseId: lesson.courseId,
        status: ContentStatus.PUBLISHED,
        OR: [
           { unit: { order: { gt: lesson.unitId ? (await prisma.unit.findUnique({ where: { id: lesson.unitId } }))?.order : -1 } } },
           { unitId: lesson.unitId, order: { gt: lesson.order } }
        ]
      },
      orderBy: [
        { unit: { order: 'asc' } },
        { order: 'asc' }
      ]
    });

    return {
      progress,
      nextLessonId: nextLesson?.id || null,
      courseCompleted: !nextLesson && (await this.isCourseFullyCompleted(lesson.courseId, student.id))
    };
  }

  /**
   * Internal: Update course progress percentage
   */
  private static async updateCourseProgress(courseId: string, studentId: string) {
    const allLessons = await prisma.lesson.findMany({
      where: { courseId, status: ContentStatus.PUBLISHED },
      select: { id: true }
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: {
        studentId,
        lesson: { courseId },
        status: 'COMPLETED'
      }
    });

    const progressPercent = allLessons.length > 0 ? Math.round((completedLessons / allLessons.length) * 100) : 0;

    await prisma.courseEnrollment.update({
      where: { courseId_studentId: { courseId, studentId } },
      data: {
        progressPercent,
        ...(progressPercent === 100 && { completedAt: new Date() })
      }
    });
  }

  /**
   * Internal: Check if course is fully completed
   */
  private static async isCourseFullyCompleted(courseId: string, studentId: string) {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } }
    });
    return enrollment?.progressPercent === 100;
  }

  /**
   * Get "Continue Learning" data for dashboard
   */
  static async getContinueLearning(userId: string) {
    const student = await this.getStudent(userId);

    // Find the last accessed course enrollment that is not completed
    const lastEnrollment = await prisma.courseEnrollment.findFirst({
      where: { studentId: student.id, completedAt: null },
      orderBy: { lastAccessedAt: 'desc' },
      include: {
        course: {
          include: {
            subject: true,
            lessons: {
              where: { status: ContentStatus.PUBLISHED },
              orderBy: [
                { unit: { order: 'asc' } },
                { order: 'asc' }
              ],
              include: {
                progress: {
                  where: { studentId: student.id }
                }
              }
            }
          }
        }
      }
    });

    if (!lastEnrollment) {
      // If no active enrollment, pick the first lesson of the first assigned course
      const firstCourse = await prisma.course.findFirst({
        where: {
          status: ContentStatus.PUBLISHED,
          levelId: student.levelId,
          OR: [
            { schoolId: student.schoolId },
            { schoolId: null }
          ]
        },
        orderBy: { order: 'asc' },
        include: { 
          subject: true, 
          lessons: { 
            where: { status: ContentStatus.PUBLISHED },
            orderBy: { order: 'asc' }, 
            take: 1 
          } 
        }
      });

      if (!firstCourse || !firstCourse.lessons[0]) return null;

      return {
        lessonId: firstCourse.lessons[0].id,
        courseId: firstCourse.id,
        courseTitle: firstCourse.title,
        subjectName: firstCourse.subject.name,
        lessonTitle: firstCourse.lessons[0].title,
        progressPercent: 0
      };
    }

    const nextLesson = lastEnrollment.course.lessons.find(l => !l.progress[0] || l.progress[0].status !== 'COMPLETED');

    if (!nextLesson) return null;

    return {
      lessonId: nextLesson.id,
      courseId: lastEnrollment.course.id,
      courseTitle: lastEnrollment.course.title,
      subjectName: lastEnrollment.course.subject.name,
      lessonTitle: nextLesson.title,
      progressPercent: lastEnrollment.progressPercent
    };
  }

  /**
   * Get comprehensive student dashboard
   */
  static async getDashboard(userId: string) {
    const student = await this.getStudent(userId);

    const [courses, subjects, continueLearning, badges, goals, notifications, certificates] = await Promise.all([
      this.getMyCourses(userId),
      this.getMySubjects(userId),
      this.getContinueLearning(userId),
      prisma.studentBadge.findMany({ where: { studentId: student.id }, include: { badge: true }, orderBy: { earnedAt: "desc" }, take: 4 }),
      prisma.goal.findMany({ where: { studentId: student.id }, orderBy: { dueDate: "asc" } }),
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.certificate.findMany({ where: { studentId: student.id }, include: { course: true } })
    ]);

    const completedLessonsCount = await prisma.lessonProgress.count({
      where: { studentId: student.id, status: 'COMPLETED' }
    });

    const points = badges.reduce((sum, item) => sum + item.badge.rewardPoints, 0) + completedLessonsCount * 5;

    return {
      student: {
        id: student.id,
        name: student.user.name,
        level: student.level.name,
        levelId: student.levelId,
        category: student.level.category,
        className: student.class?.name,
        schoolName: student.school?.name,
        avatar: student.avatar
      },
      stats: {
        points,
        stars: points,
        badges: badges.length,
        completedLessons: completedLessonsCount,
        certificates: certificates.length,
        streakDays: 3 // Placeholder
      },
      courses,
      subjects,
      continueLearning,
      goals,
      recentBadges: badges.map(item => ({
        id: item.id,
        name: item.badge.name,
        icon: item.badge.icon,
        rewardPoints: item.badge.rewardPoints,
        earnedAt: item.earnedAt
      })),
      notifications
    };
  }
}
