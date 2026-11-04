import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, Loader2, Save, Send, X } from "lucide-react";
import { lmsService } from "@/services/lmsService";
import { invalidateTeacherDashboard } from "@/hooks/useTeacherDashboard";
import { pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { Button } from "./teacherShared";
import { useTeacherReferenceData } from "./teacherReference";
import { useLessonAi } from "./hooks/useLessonAi";

// --- Sub-components ---
import { LessonFormBody } from "./components/lesson/LessonFormBody";
import { LessonPreviewModal } from "./components/lesson/LessonPreviewModal";

interface LessonFormData {
  title: string;
  classId: string;
  subjectId: string;
  topic?: string;
  learningObjectives?: string;
  genericCompetencies?: string[];
  crossCuttingIssues?: string[];
  teacherActivities?: string;
  learnerActivities?: string;
  assessmentCriteria?: string;
  lessonContentHtml: string;
  status: "draft" | "published";
}

interface ValidationErrors {
  classId?: string;
  subjectId?: string;
  lessonContentHtml?: string;
}

function isEmptyHtml(html: string): boolean {
  if (!html) return true;
  const cleaned = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, "")
    .trim();
  return cleaned.length === 0;
}

export function CreateLessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const reference = useTeacherReferenceData();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<LessonFormData>({
    title: "",
    classId: "",
    subjectId: "",
    topic: "",
    learningObjectives: "",
    genericCompetencies: [],
    crossCuttingIssues: [],
    teacherActivities: "",
    learnerActivities: "",
    assessmentCriteria: "",
    lessonContentHtml: "",
    status: "draft",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const classOptions = useMemo(() => {
    const assignedClassIds = new Set((reference.data.assignments || []).map((a: any) => a.classId));
    return reference.data.classes
      .filter((cls: any) => assignedClassIds.has(cls.id))
      .map((cls: any) => ({
        value: cls.id,
        label: cls.name,
        description: cls.levelName,
      }));
  }, [reference.data.classes, reference.data.assignments]);

  const subjectOptions = useMemo(() => {
    if (!formData.classId) return [];
    const assignedSubjectNames = new Set(
      (reference.data.assignments || [])
        .filter((a: any) => a.classId === formData.classId)
        .map((a: any) => (a.subjectName || "").toLowerCase()),
    );
    return reference.data.subjects
      .filter((subj: any) => assignedSubjectNames.has((subj.name || "").toLowerCase()))
      .map((subj: any) => ({
        value: subj.id || subj.name,
        label: subj.name,
        description: subj.levelName || subj.category,
      }));
  }, [formData.classId, reference.data.subjects, reference.data.assignments]);

  useEffect(() => {
    if (formData.classId && !formData.subjectId && subjectOptions.length === 1) {
      setFormData((prev) => ({ ...prev, subjectId: subjectOptions[0].value }));
    }
  }, [formData.classId, formData.subjectId, subjectOptions]);

  const loadLessonData = useCallback(async () => {
    if (!isEditMode || !id) return;
    setIsLoading(true);
    try {
      const response = await lmsService.lessonPlans({ pageSize: 1000 });
      const lesson = response.items?.find((item: any) => item.id === id);
      if (lesson)
        setFormData({
          title: lesson.title || "",
          classId: lesson.classId || "",
          subjectId: lesson.subjectId || lesson.subjectName || "",
          topic: lesson.topic || "",
          learningObjectives: lesson.learningObjectives || "",
          genericCompetencies: lesson.genericCompetencies || [],
          crossCuttingIssues: lesson.crossCuttingIssues || [],
          teacherActivities: lesson.teacherActivities || "",
          learnerActivities: lesson.learnerActivities || "",
          lessonContentHtml: lesson.lessonContentHtml || lesson.content || lesson.body || "",
          status: lesson.status === "PUBLISHED" ? "published" : "draft",
        });
    } catch (e) {
      dispatch(pushToast({ tone: "error", message: "Could not load lesson plan" }));
    } finally {
      setIsLoading(false);
    }
  }, [isEditMode, id, dispatch]);

  useEffect(() => {
    loadLessonData();
  }, [loadLessonData]);

  const { generate: handleAiGenerate, isGenerating: isAiGenerating } = useLessonAi({
    classId: formData.classId,
    subjectId: formData.subjectId,
    currentContent: formData.lessonContentHtml,
    classes: reference.data.classes,
    subjects: reference.data.subjects,
    onGenerated: (data) =>
      setFormData((prev) => ({
        ...prev,
        ...data,
        lessonContentHtml: data.html,
        title: prev.title || data.title,
      })),
  });

  const saveLesson = useMutation({
    mutationFn: async (publish: boolean) => {
      const payload = { ...formData, status: publish ? "published" : "draft" };
      return isEditMode && id
        ? lmsService.updateLessonPlan(id, payload)
        : lmsService.createLessonPlan(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-lesson-plans"] });
      invalidateTeacherDashboard(queryClient);
      dispatch(
        pushToast({
          tone: "success",
          message: isEditMode ? "Lesson plan updated!" : "Lesson plan created!",
        }),
      );
      navigate("/teacher/lessons");
    },
    onError: (e) =>
      dispatch(
        pushToast({
          tone: "error",
          message: e instanceof Error ? e.message : "Could not save lesson plan",
        }),
      ),
    onSettled: () => setIsSaving(false),
  });

  const handleAction = (publish: boolean) => {
    const newErrors: ValidationErrors = {};
    if (!formData.classId) newErrors.classId = "Please select a class";
    if (!formData.subjectId) newErrors.subjectId = "Please select a subject";
    if (isEmptyHtml(formData.lessonContentHtml))
      newErrors.lessonContentHtml = "Please write content";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setIsSaving(true);
      saveLesson.mutate(publish);
    }
  };

  if (isLoading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-[#6d3eeb]" />
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Eye size={18} /> Preview
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          {isEditMode ? "Edit Lesson" : "Create Lesson"}
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {isEditMode
            ? "Update your lesson plan below"
            : "Fill in the details for your new lesson plan"}
        </p>
      </div>

      <LessonFormBody
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        reference={reference}
        classOptions={classOptions}
        subjectOptions={subjectOptions}
        handleClassChange={(v) => {
          setFormData((p) => ({ ...p, classId: v || "", subjectId: "" }));
          setErrors((p) => ({ ...p, classId: undefined }));
        }}
        handleSubjectChange={(v) => {
          setFormData((p) => ({ ...p, subjectId: v || "" }));
          setErrors((p) => ({ ...p, subjectId: undefined }));
        }}
        handleContentChange={(h) => {
          setFormData((p) => ({ ...p, lessonContentHtml: h }));
          setErrors((p) => ({ ...p, lessonContentHtml: undefined }));
        }}
        handleAiGenerate={handleAiGenerate}
        isAiGenerating={isAiGenerating}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6 mt-10">
        <button
          onClick={() => navigate("/teacher/lessons")}
          className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <X size={18} /> Cancel
        </button>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleAction(false)}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            <Save size={18} /> Save Draft
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-[#6d3eeb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5b31cb]"
          >
            <Send size={18} /> Publish Lesson
          </button>
        </div>
      </div>

      <LessonPreviewModal
        show={showPreview}
        onClose={() => setShowPreview(false)}
        formData={formData}
        reference={reference}
      />
    </div>
  );
}

export function LessonForm({
  record,
  mode,
  onClose,
}: {
  record?: any;
  mode?: "create" | "edit";
  onClose?: () => void;
}) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const reference = useTeacherReferenceData();
  const isEditMode = mode === "edit" && record?.id;

  const [formData, setFormData] = useState<LessonFormData>({
    title: record?.title || "",
    classId: record?.classId || "",
    subjectId: record?.subjectId || record?.subjectName || "",
    topic: record?.topic || "",
    learningObjectives: record?.learningObjectives || "",
    genericCompetencies: record?.genericCompetencies || [],
    crossCuttingIssues: record?.crossCuttingIssues || [],
    teacherActivities: record?.teacherActivities || "",
    learnerActivities: record?.learnerActivities || "",
    assessmentCriteria: record?.assessmentCriteria || "",
    lessonContentHtml: record?.lessonContentHtml || record?.content || record?.body || "",
    status: "draft",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const { generate: handleAiGenerate, isGenerating: isAiGenerating } = useLessonAi({
    classId: formData.classId,
    subjectId: formData.subjectId,
    currentContent: formData.lessonContentHtml,
    classes: reference.data.classes,
    subjects: reference.data.subjects,
    onGenerated: (data) =>
      setFormData((p) => ({
        ...p,
        ...data,
        lessonContentHtml: data.html,
        title: p.title || data.title,
      })),
  });

  const classOptions = useMemo(() => {
    const assignedIds = new Set((reference.data.assignments || []).map((a: any) => a.classId));
    return reference.data.classes
      .filter((cls: any) => assignedIds.has(cls.id))
      .map((cls: any) => ({ value: cls.id, label: cls.name, description: cls.levelName }));
  }, [reference.data.classes, reference.data.assignments]);

  const subjectOptions = useMemo(() => {
    if (!formData.classId) return [];
    const assignedNames = new Set(
      (reference.data.assignments || [])
        .filter((a: any) => a.classId === formData.classId)
        .map((a: any) => (a.subjectName || "").toLowerCase()),
    );
    return reference.data.subjects
      .filter((s: any) => assignedNames.has((s.name || "").toLowerCase()))
      .map((s: any) => ({ value: s.id || s.name, label: s.name, description: s.levelName }));
  }, [formData.classId, reference.data.subjects, reference.data.assignments]);

  const saveMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const payload = { ...formData, status: publish ? "published" : "draft" };
      return isEditMode
        ? lmsService.updateLessonPlan(record.id, payload)
        : lmsService.createLessonPlan(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-lesson-plans"] });
      invalidateTeacherDashboard(queryClient);
      dispatch(
        pushToast({
          tone: "success",
          message: isEditMode ? "Lesson plan updated!" : "Lesson plan created!",
        }),
      );
      onClose?.();
    },
    onError: (e) =>
      dispatch(
        pushToast({
          tone: "error",
          message: e instanceof Error ? e.message : "Could not save lesson plan",
        }),
      ),
    onSettled: () => setIsSaving(false),
  });

  const handleSave = (publish: boolean) => {
    const newErrors: ValidationErrors = {};
    if (!formData.classId) newErrors.classId = "Required";
    if (!formData.subjectId) newErrors.subjectId = "Required";
    if (isEmptyHtml(formData.lessonContentHtml)) newErrors.lessonContentHtml = "Required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setIsSaving(true);
      saveMutation.mutate(publish);
    }
  };

  return (
    <div className="space-y-4">
      <LessonFormBody
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        editorMinHeight="300px"
        reference={reference}
        classOptions={classOptions}
        subjectOptions={subjectOptions}
        handleClassChange={(v) => {
          setFormData((p) => ({ ...p, classId: v || "", subjectId: "" }));
          setErrors((p) => ({ ...p, classId: undefined }));
        }}
        handleSubjectChange={(v) => {
          setFormData((p) => ({ ...p, subjectId: v || "" }));
          setErrors((p) => ({ ...p, subjectId: undefined }));
        }}
        handleContentChange={(h) => {
          setFormData((p) => ({ ...p, lessonContentHtml: h }));
          setErrors((p) => ({ ...p, lessonContentHtml: undefined }));
        }}
        handleAiGenerate={handleAiGenerate}
        isAiGenerating={isAiGenerating}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => handleSave(false)} disabled={isSaving}>
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          Draft
        </Button>
        <Button onClick={() => handleSave(true)} disabled={isSaving}>
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Publish
        </Button>
      </div>
    </div>
  );
}

export default CreateLessonPage;
