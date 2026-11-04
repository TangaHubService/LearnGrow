import {
  courseApi,
  type CourseRecord,
  type CourseUnit,
  type CourseLesson,
  type ContentStatus,
} from "./courseApi";
import { teacherApi, type ListParams } from "./teacherApi";
import { resourcesApi } from "./resourcesApi";

// Re-export types
export type { CourseRecord, CourseUnit, CourseLesson, ContentStatus, ListParams };

export const lmsService = {
  ...teacherApi,
  ...courseApi,
  resources: resourcesApi,
};
