import { FormEvent, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CustomDropdown, EntitySelect } from "@/components/ModernUi";
import { lmsService } from "@/services/lmsService";
import { invalidateTeacherDashboard } from "@/hooks/useTeacherDashboard";
import { closeDrawer, pushToast, setDrawerUploading } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { languageOptions, messageCategoryOptions, resourceTypeOptions } from "../teacherShared";
import { useTeacherReferenceData } from "../teacherReference";
import {
  ClassSelect,
  Input,
  LevelSelect,
  RecipientSelect,
  SubjectSelect,
  Textarea,
} from "../TeacherFormFields";

export function TeacherForm({ kind, record }: { kind: string; record: any }) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const reference = useTeacherReferenceData();
  const [error, setError] = useState("");
  const [classId, setClassId] = useState(
    kind === "resource-form" ? (record?.classId ?? "") : (record?.classId ?? record?.id ?? ""),
  );
  const [levelId, setLevelId] = useState(record?.levelId ?? "");
  const [subjectName, setSubjectName] = useState(record?.subjectName ?? "");
  const [language, setLanguage] = useState(record?.language ?? "en");
  const [recipientId, setRecipientId] = useState(record?.recipient?.id ?? "");
  const [messageCategory, setMessageCategory] = useState(record?.category ?? "GENERAL");
  const [resourceType, setResourceType] = useState(record?.type ?? "PDF");

  // Premium resources states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [subjectId, setSubjectId] = useState(record?.subjectId ?? "");
  const [courseId, setCourseId] = useState(record?.courseId ?? "");
  const [lessonId, setLessonId] = useState(record?.lessonId ?? "");
  const [tagsText, setTagsText] = useState((record?.tags ?? []).join(", ") ?? "");
  const [sharedScope, setSharedScope] = useState(record?.sharedScope ?? "PRIVATE");

  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ["courses-list-for-select", subjectId],
    queryFn: () => lmsService.list({ subjectId: subjectId || undefined }),
    enabled: !!subjectId && kind === "resource-form",
  });
  const courses = coursesData?.data?.courses ?? [];
  const selectedCourse = courses.find((c: any) => c.id === courseId);
  const lessons = selectedCourse?.lessons ?? [];

  const onMutationError = (fallback: string) => (mutationError: unknown) => {
    const message = mutationError instanceof Error ? mutationError.message : fallback;
    setError(message);
    dispatch(pushToast({ tone: "error", message }));
  };

  function refreshDashboardAfterMutation() {
    invalidateTeacherDashboard(queryClient);
  }

  const createLesson = useMutation({
    mutationFn: (payload: any) => lmsService.createLesson(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-lessons"] });
      refreshDashboardAfterMutation();
      dispatch(closeDrawer());
      dispatch(pushToast({ tone: "success", message: "Lesson saved" }));
    },
    onError: onMutationError("Lesson could not be saved"),
  });

  const updateLessonMutation = useMutation({
    mutationFn: (payload: any) => lmsService.updateLesson(record.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-lessons"] });
      refreshDashboardAfterMutation();
      dispatch(closeDrawer());
      dispatch(pushToast({ tone: "success", message: "Lesson updated" }));
    },
    onError: onMutationError("Lesson could not be updated"),
  });

  const createQuiz = useMutation({
    mutationFn: (payload: any) => lmsService.createQuiz(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-quizzes"] });
      refreshDashboardAfterMutation();
      dispatch(closeDrawer());
      dispatch(pushToast({ tone: "success", message: "Quiz saved" }));
    },
    onError: onMutationError("Quiz could not be saved"),
  });

  const updateQuizMutation = useMutation({
    mutationFn: (payload: any) => lmsService.updateQuiz(record.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-quizzes"] });
      refreshDashboardAfterMutation();
      dispatch(closeDrawer());
      dispatch(pushToast({ tone: "success", message: "Quiz updated" }));
    },
    onError: onMutationError("Quiz could not be updated"),
  });

  const createClass = useMutation({
    mutationFn: lmsService.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-classes"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-reference-data"] });
      refreshDashboardAfterMutation();
      dispatch(closeDrawer());
      dispatch(pushToast({ tone: "success", message: "Class saved" }));
    },
    onError: onMutationError("Class could not be saved"),
  });

  const updateClassMutation = useMutation({
    mutationFn: (payload: any) => lmsService.updateClass(record.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-classes"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-reference-data"] });
      refreshDashboardAfterMutation();
      dispatch(closeDrawer());
      dispatch(pushToast({ tone: "success", message: "Class updated" }));
    },
    onError: onMutationError("Class could not be updated"),
  });

  const createStudentMutation = useMutation({
    mutationFn: lmsService.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-students"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-reference-data"] });
      refreshDashboardAfterMutation();
      dispatch(closeDrawer());
      dispatch(pushToast({ tone: "success", message: "Student saved" }));
    },
    onError: onMutationError("Student could not be saved"),
  });

  const updateStudentMutation = useMutation({
    mutationFn: (payload: any) => lmsService.updateStudent(record.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-students"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-reference-data"] });
      refreshDashboardAfterMutation();
      dispatch(closeDrawer());
      dispatch(pushToast({ tone: "success", message: "Student updated" }));
    },
    onError: onMutationError("Student could not be updated"),
  });

  const sendMessageMutation = useMutation({
    mutationFn: lmsService.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-messages"] });
      dispatch(closeDrawer());
      dispatch(pushToast({ tone: "success", message: "Message sent" }));
    },
    onError: onMutationError("Message could not be sent"),
  });

  const createResourceMutation = useMutation({
    mutationFn: lmsService.createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-resources"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-resource-folders"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-resources-in-folder"] });
      dispatch(closeDrawer());
      dispatch(pushToast({ tone: "success", message: "Resource saved" }));
    },
    onError: onMutationError("Resource could not be saved"),
  });

  const updateResourceMutation = useMutation({
    mutationFn: (payload: any) => lmsService.updateResource(record.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-resources"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-resource-folders"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-resources-in-folder"] });
      dispatch(closeDrawer());
      dispatch(pushToast({ tone: "success", message: "Resource updated" }));
    },
    onError: onMutationError("Resource could not be updated"),
  });

  const anyMutationPending =
    createLesson.isPending ||
    updateLessonMutation.isPending ||
    createQuiz.isPending ||
    updateQuizMutation.isPending ||
    createClass.isPending ||
    updateClassMutation.isPending ||
    createStudentMutation.isPending ||
    updateStudentMutation.isPending ||
    sendMessageMutation.isPending ||
    createResourceMutation.isPending ||
    updateResourceMutation.isPending ||
    isUploading;

  useEffect(() => {
    dispatch(setDrawerUploading(anyMutationPending));
    return () => {
      dispatch(setDrawerUploading(false));
    };
  }, [anyMutationPending, dispatch]);

  function showValidation(message: string) {
    setError(message);
    dispatch(pushToast({ tone: "error", message }));
  }

  function requireFields(
    payload: Record<string, FormDataEntryValue>,
    fields: Record<string, string>,
  ) {
    const missing = Object.entries(fields).find(([key]) => !String(payload[key] ?? "").trim());
    if (missing) {
      showValidation(`${missing[1]} is required.`);
      return false;
    }
    return true;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, FormDataEntryValue>;
    setError("");
    if (kind === "class-form") {
      if (!requireFields(payload, { name: "Class", levelId: "Level", subjectName: "Subject" }))
        return;
      const data = {
        name: payload.name,
        levelId: payload.levelId,
        subjectName: payload.subjectName,
        performance: Number(payload.performance || 0),
      };
      if (record?.id) {
        updateClassMutation.mutate(data);
      } else {
        createClass.mutate(data);
      }
      return;
    }
    if (kind === "student-form") {
      if (!requireFields(payload, { name: "Student name", email: "Email", classId: "Class" }))
        return;
      const data = {
        classId: payload.classId,
        name: payload.name,
        email: payload.email,
        language: payload.language,
        interests: String(payload.interests ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      if (record?.id) {
        updateStudentMutation.mutate(data);
      } else {
        createStudentMutation.mutate(data);
      }
      return;
    }
    if (kind === "quiz-form") {
      if (
        !requireFields(payload, {
          classId: "Class",
          subjectName: "Subject",
          topic: "Topic",
          title: "Quiz title",
        })
      )
        return;
      const data = {
        classId: payload.classId,
        subjectName: payload.subjectName,
        topic: payload.topic,
        title: payload.title,
        durationMinutes: Number(payload.durationMinutes || 15),
        randomizeQuestions: true,
        showResults: true,
        questions: [
          {
            type: "MULTIPLE_CHOICE",
            questionText: String(payload.questionText || "Sample question"),
            options: ["A", "B", "C"],
            answer: "A",
            explanation: "Sample explanation",
            points: 1,
          },
        ],
      };
      if (record?.id) {
        updateQuizMutation.mutate(data);
      } else {
        createQuiz.mutate(data);
      }
      return;
    }
    if (kind === "message-form") {
      if (!requireFields(payload, { recipientId: "Recipient", body: "Message" })) return;
      sendMessageMutation.mutate({
        recipientId: payload.recipientId,
        body: payload.body,
        category: payload.category,
      });
      return;
    }
    if (kind === "resource-form") {
      if (!requireFields(payload, { title: "Resource title" })) return;

      if (!classId) {
        showValidation("Please select a class for this resource.");
        return;
      }
      if (!subjectId) {
        showValidation("Please select a subject for this resource.");
        return;
      }
      if (!lessonId) {
        showValidation("Please select a lesson for this resource.");
        return;
      }

      const tagsList = tagsText
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean);

      if (record?.id) {
        // Update resource metadata
        updateResourceMutation.mutate({
          title: payload.title,
          description: payload.description || "",
          type: resourceType,
          classId: classId || null,
          subjectId: subjectId || null,
          courseId: courseId || null,
          lessonId: lessonId || null,
          tags: tagsList,
          sharedScope: sharedScope,
        });
      } else {
        // Upload new resource with attachment or link
        if (resourceType !== "LINK" && !selectedFile) {
          showValidation("Please upload a file or switch to LINK type.");
          return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        if (selectedFile) {
          formData.append("file", selectedFile);
        }
        formData.append("title", String(payload.title));
        formData.append("description", String(payload.description || ""));
        formData.append("type", resourceType);
        if (classId) formData.append("classId", classId);
        if (subjectId) formData.append("subjectId", subjectId);
        if (courseId) formData.append("courseId", courseId);
        if (lessonId) formData.append("lessonId", lessonId);
        formData.append("tags", JSON.stringify(tagsList));
        formData.append("sharedScope", sharedScope);

        lmsService.resources
          .upload(formData, (percent) => {
            setUploadProgress(percent);
          })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["teacher-resources"] });
            queryClient.invalidateQueries({ queryKey: ["teacher-resource-folders"] });
            queryClient.invalidateQueries({ queryKey: ["teacher-resources-in-folder"] });
            dispatch(closeDrawer());
            dispatch(pushToast({ tone: "success", message: "Resource uploaded successfully" }));
          })
          .catch((err: any) => {
            const errMsg = err instanceof Error ? err.message : "Failed to upload file.";
            setError(errMsg);
            dispatch(pushToast({ tone: "error", message: errMsg }));
          })
          .finally(() => {
            setIsUploading(false);
          });
      }
      return;
    }
    if (!requireFields(payload, { classId: "Class", subjectName: "Subject" })) return;
    const data = {
      classId: payload.classId,
      subjectName: payload.subjectName,
      className: payload.className || "",
      lessonContentHtml: payload.lessonContentHtml || "",
      status: "DRAFT",
      scheduledAt: new Date(),
    };
    if (record?.id) {
      updateLessonMutation.mutate(data);
    } else {
      createLesson.mutate(data);
    }
  }

  const formError = error ? (
    <p className="rounded-lg bg-red-50 px-3 py-2 font-medium text-red-600">{error}</p>
  ) : null;

  if (kind === "class-form")
    return (
      <form id="teacher-drawer-form" onSubmit={submit} className="space-y-4">
        <Input
          name="name"
          label="Class name"
          defaultValue={record?.name ?? "Primary 3A"}
          required
        />
        <LevelSelect value={levelId} onChange={setLevelId} reference={reference} />
        <SubjectSelect value={subjectName} onChange={setSubjectName} reference={reference} />
        <Input name="performance" label="Performance" defaultValue={record?.performance ?? "75"} />
        {formError}
      </form>
    );

  if (kind === "student-form")
    return (
      <form id="teacher-drawer-form" onSubmit={submit} className="space-y-4">
        <Input
          name="name"
          label="Student full name"
          defaultValue={record?.user?.name ?? record?.name ?? ""}
          required
        />
        <Input
          name="email"
          label="Student email"
          defaultValue={record?.user?.email ?? record?.email ?? ""}
          required
        />
        <ClassSelect value={classId} onChange={setClassId} reference={reference} />
        <CustomDropdown
          label="Language"
          name="language"
          value={language}
          options={languageOptions}
          clearable={false}
          onChange={(value) => setLanguage(value ?? "en")}
        />
        <Input
          name="interests"
          label="Interests"
          defaultValue={(record?.interests ?? ["math", "reading"]).join?.(", ") ?? ""}
        />
        {formError}
      </form>
    );

  if (kind === "quiz-form")
    return (
      <form id="teacher-drawer-form" onSubmit={submit} className="space-y-4">
        <ClassSelect value={classId} onChange={setClassId} reference={reference} />
        <SubjectSelect value={subjectName} onChange={setSubjectName} reference={reference} />
        <Input name="topic" label="Topic" defaultValue={record?.topic ?? "Fractions"} required />
        <Input
          name="title"
          label="Quiz title"
          defaultValue={record?.title ?? "Fractions Quick Quiz"}
          required
        />
        <Input
          name="durationMinutes"
          label="Duration"
          defaultValue={record?.durationMinutes ?? "15"}
        />
        <Input
          name="questionText"
          label="First question"
          defaultValue={record?.questions?.[0]?.questionText ?? "Which picture shows one half?"}
        />
        {formError}
      </form>
    );

  if (kind === "message-form")
    return (
      <form id="teacher-drawer-form" onSubmit={submit} className="space-y-4">
        <RecipientSelect value={recipientId} onChange={setRecipientId} reference={reference} />
        <CustomDropdown
          label="Category"
          name="category"
          value={messageCategory}
          options={messageCategoryOptions}
          clearable={false}
          onChange={(value) => setMessageCategory(value ?? "GENERAL")}
        />
        <Textarea name="body" label="Message" defaultValue={record?.body ?? ""} />
        {formError}
      </form>
    );

  if (kind === "resource-form") {
    const fileInputId = "resource-file-input";

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        setSelectedFile(e.dataTransfer.files[0]);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setSelectedFile(e.target.files[0]);
      }
    };

    return (
      <form id="teacher-drawer-form" onSubmit={submit} className="space-y-4">
        <Input name="title" label="Resource title" defaultValue={record?.title ?? ""} required />

        <label className="grid gap-2 font-medium text-slate-700">
          Description
          <textarea
            name="description"
            defaultValue={record?.description ?? ""}
            placeholder="Provide details about what this resource covers..."
            className="min-h-20 rounded-lg border border-slate-200 p-3 font-normal text-slate-900 outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </label>

        <CustomDropdown
          label="Resource type"
          name="type"
          value={resourceType}
          options={resourceTypeOptions}
          clearable={false}
          onChange={(value) => {
            setResourceType(value ?? "PDF");
            setSelectedFile(null);
          }}
        />

        {resourceType === "LINK" ? (
          <Input
            name="fileUrl"
            label="File URL link"
            defaultValue={record?.fileUrl ?? ""}
            required
          />
        ) : (
          <div className="space-y-2">
            <span className="block font-medium text-slate-700">File Attachment</span>
            {selectedFile ? (
              <div className="flex items-center justify-between rounded-lg border border-purple-100 bg-purple-50/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6d3eeb] text-white font-bold text-xs uppercase">
                    {selectedFile.name.split(".").pop() || "FILE"}
                  </div>
                  <div>
                    <p className="max-w-[200px] truncate text-sm font-semibold text-slate-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById(fileInputId)?.click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${
                  dragActive
                    ? "border-[#6d3eeb] bg-purple-50/40 scale-[0.99]"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                }`}
              >
                <input
                  id={fileInputId}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <svg
                  className={`h-10 w-10 mb-3 transition-colors ${dragActive ? "text-[#6d3eeb]" : "text-slate-500"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-700">
                  {dragActive ? "Drop to upload file" : "Drag & drop your file here"}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  or click to browse files from your computer
                </span>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6d3eeb]">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#6d3eeb] transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-slate-100 my-4 pt-4 space-y-4">
          <span className="block font-semibold text-slate-900 text-sm">Curriculum Alignment</span>

          <ClassSelect value={classId} onChange={setClassId} reference={reference} />

          <EntitySelect
            label="Subject"
            value={subjectId}
            options={reference.data.subjects}
            loading={reference.isLoading}
            placeholder="Select subject"
            emptyMessage="No subjects found. Please create subjects before uploading."
            getOptionValue={(s: any) => s.id}
            getOptionLabel={(s: any) => s.name}
            getOptionDescription={(s: any) => s.levelName ?? s.category}
            searchKeys={[(s: any) => s.name, (s: any) => s.levelName, (s: any) => s.category]}
            onChange={(next) => {
              setSubjectId(next ?? "");
              setCourseId("");
              setLessonId("");
            }}
          />

          <EntitySelect
            label="Course"
            value={courseId}
            options={courses}
            loading={loadingCourses}
            placeholder="Select course if applicable"
            emptyMessage="No courses found for this subject."
            getOptionValue={(c: any) => c.id}
            getOptionLabel={(c: any) => c.title}
            getOptionDescription={(c: any) => c.description}
            searchKeys={[(c: any) => c.title]}
            onChange={(next) => {
              setCourseId(next ?? "");
              setLessonId("");
            }}
          />

          <EntitySelect
            label="Lesson"
            value={lessonId}
            options={lessons}
            placeholder="Select lesson if applicable"
            emptyMessage="No lessons found for this course."
            getOptionValue={(l: any) => l.id}
            getOptionLabel={(l: any) => l.title}
            getOptionDescription={(l: any) => l.topic}
            searchKeys={[(l: any) => l.title, (l: any) => l.topic]}
            onChange={(next) => setLessonId(next ?? "")}
          />
        </div>

        <div className="border-t border-slate-100 my-4 pt-4 space-y-4">
          <span className="block font-semibold text-slate-900 text-sm">Access & Tags</span>

          <label className="grid gap-2 font-medium text-slate-700">
            Tags
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="e.g. algebra, exam-prep, midterm"
              className="h-11 rounded-lg border border-slate-200 px-3 font-normal text-slate-900 outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
            />
            <span className="text-xs text-slate-500 font-normal">
              Comma-separated tags for resource organization.
            </span>
          </label>

          <CustomDropdown
            label="Visibility"
            value={sharedScope}
            options={[
              { value: "PRIVATE", label: "Only Me (Private)" },
              { value: "PUBLIC", label: "Public to School (Teachers & Students)" },
            ]}
            clearable={false}
            onChange={(value) => setSharedScope(value ?? "PRIVATE")}
          />
        </div>

        {formError}
      </form>
    );
  }

  return (
    <form id="teacher-drawer-form" onSubmit={submit} className="space-y-4">
      <ClassSelect value={classId} onChange={setClassId} reference={reference} />
      <SubjectSelect value={subjectName} onChange={setSubjectName} reference={reference} />
      <Input name="className" label="Class Name" defaultValue={record?.className ?? ""} />
      <Textarea
        name="lessonContentHtml"
        label="Lesson Plan Content"
        defaultValue={record?.lessonContentHtml ?? ""}
      />
      {formError}
    </form>
  );
}
