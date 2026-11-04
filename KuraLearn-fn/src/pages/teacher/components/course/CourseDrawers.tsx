import { AppDrawer } from "@/components/ModernUi";
import { UnitForm } from "./UnitForm";
import { LessonForm } from "./LessonForm";
import { AssignmentForm } from "./AssignmentForm";
import { QuizForm } from "./QuizForm";
import { AssignCourseForm } from "./AssignCourseForm";
import { CourseUnit, CourseLesson } from "@/services/lmsService";

export type DrawerState =
  | { kind: "unit-create"; courseId: string }
  | { kind: "unit-edit"; unit: CourseUnit }
  | { kind: "lesson-create"; courseId: string; unitId?: string }
  | { kind: "lesson-edit"; lesson: CourseLesson }
  | { kind: "assignment-create"; courseId: string }
  | { kind: "assignment-edit"; assignment: any }
  | { kind: "quiz-create"; courseId: string }
  | { kind: "quiz-edit"; quiz: any }
  | { kind: "course-assign"; courseId: string }
  | null;

export function CourseDrawers({
  state,
  onClose,
  mutations,
  courseId,
}: {
  state: DrawerState;
  onClose: () => void;
  mutations: {
    createUnit: any;
    updateUnit: any;
    createLesson: any;
    updateLesson: any;
    createAssignment: any;
    updateAssignment: any;
    createQuiz: any;
    updateQuiz: any;
    assignCourse: any;
  };
  courseId: string;
}) {
  return (
    <>
      <AppDrawer
        open={state?.kind === "unit-create" || state?.kind === "unit-edit"}
        size="md"
        onClose={onClose}
      >
        <UnitForm
          unit={state?.kind === "unit-edit" ? state.unit : undefined}
          isSubmitting={mutations.createUnit.isPending || mutations.updateUnit.isPending}
          onSubmit={(data) => {
            if (state?.kind === "unit-edit") {
              mutations.updateUnit.mutate({ id: state.unit.id, input: data });
            } else if (state?.kind === "unit-create") {
              mutations.createUnit.mutate(data);
            }
          }}
        />
      </AppDrawer>

      <AppDrawer
        open={state?.kind === "lesson-create" || state?.kind === "lesson-edit"}
        title={state?.kind === "lesson-edit" ? "Edit Lesson" : "Add Lesson"}
        size="3xl"
        onClose={onClose}
      >
        <LessonForm
          lesson={state?.kind === "lesson-edit" ? state.lesson : undefined}
          isSubmitting={mutations.createLesson.isPending || mutations.updateLesson.isPending}
          onSubmit={(data) => {
            if (state?.kind === "lesson-edit") {
              mutations.updateLesson.mutate({ id: state.lesson.id, input: data });
            } else if (state?.kind === "lesson-create") {
              mutations.createLesson.mutate({ unitId: state.unitId, input: data });
            }
          }}
        />
      </AppDrawer>

      <AppDrawer
        open={state?.kind === "assignment-create" || state?.kind === "assignment-edit"}
        title={state?.kind === "assignment-edit" ? "Edit Assignment" : "Add Assignment"}
        size="2xl"
        onClose={onClose}
      >
        <AssignmentForm
          assignment={state?.kind === "assignment-edit" ? state.assignment : undefined}
          isSubmitting={
            mutations.createAssignment.isPending || mutations.updateAssignment.isPending
          }
          onSubmit={(data) => {
            if (state?.kind === "assignment-edit") {
              mutations.updateAssignment.mutate({ id: state.assignment.id, input: data });
            } else {
              mutations.createAssignment.mutate(data);
            }
          }}
        />
      </AppDrawer>

      <AppDrawer
        open={state?.kind === "quiz-create" || state?.kind === "quiz-edit"}
        title={state?.kind === "quiz-edit" ? "Edit Quiz" : "Add Quiz"}
        size="2xl"
        onClose={onClose}
      >
        <QuizForm
          quiz={state?.kind === "quiz-edit" ? state.quiz : undefined}
          isSubmitting={mutations.createQuiz.isPending || mutations.updateQuiz.isPending}
          onSubmit={(data) => {
            if (state?.kind === "quiz-edit") {
              mutations.updateQuiz.mutate({ id: state.quiz.id, input: data });
            } else {
              mutations.createQuiz.mutate(data);
            }
          }}
        />
      </AppDrawer>

      <AppDrawer
        open={state?.kind === "course-assign"}
        title="Assign Course"
        size="md"
        onClose={onClose}
      >
        {state?.kind === "course-assign" && (
          <AssignCourseForm
            courseId={courseId}
            isSubmitting={mutations.assignCourse.isPending}
            onSubmit={(data) => mutations.assignCourse.mutate(data)}
            onCancel={onClose}
          />
        )}
      </AppDrawer>
    </>
  );
}
