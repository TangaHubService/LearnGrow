import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Save, Send, ShieldCheck, WifiOff } from "lucide-react";
import * as XLSX from "xlsx";
import { pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { Button, PageHeader } from "./teacherShared";
import { TeacherGlobalUi } from "./TeacherGlobalUi";
import { ApprovalStatusBadge } from "@/components/marks/ApprovalStatusBadge";
import {
  MarksContextSelector,
  type MarksSelectorValue,
} from "@/components/marks/MarksContextSelector";
import { MarksEntryGrid } from "@/components/marks/MarksEntryGrid";
import { MissingMarksPanel } from "@/components/marks/MissingMarksPanel";
import { AnalyticsMetricCard } from "@/components/marks/AnalyticsMetricCard";
import { marksWorkflowApi, type MarkSubmissionDetail } from "@/services/marksWorkflowApi";

type DraftRow = {
  studentId: string;
  student: any;
  score: string;
  teacherComments: string;
};

const defaultSelector: MarksSelectorValue = {
  academicYearId: localStorage.getItem("kuralearn_active_academic_year") || "",
  termId: "",
  classId: "",
  subjectId: "",
  assessmentType: "CAT",
  maxScore: 100,
};

export function TeacherMarksPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selector, setSelector] = useState<MarksSelectorValue>(defaultSelector);
  const [submissionId, setSubmissionId] = useState<string>("");
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<
    "idle" | "saving" | "saved" | "error" | "offline"
  >("idle");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const contextQuery = useQuery({
    queryKey: ["marks-context", selector.classId, selector.subjectId, selector.termId],
    queryFn: () =>
      marksWorkflowApi.context({
        classId: selector.classId || undefined,
        subjectId: selector.subjectId || undefined,
        termId: selector.termId || undefined,
      }),
  });

  useEffect(() => {
    const context = contextQuery.data;
    if (!context) return;
    setSelector((current) => {
      const academicYearId =
        current.academicYearId &&
        context.academicYears.some((item: any) => item.id === current.academicYearId)
          ? current.academicYearId
          : context.academicYears.find((item: any) => item.status === "ACTIVE")?.id ||
            context.academicYears[0]?.id ||
            "";
      const termOptions = context.terms.filter(
        (item: any) => !academicYearId || item.academicYearId === academicYearId,
      );
      const termId =
        current.termId && termOptions.some((item: any) => item.id === current.termId)
          ? current.termId
          : termOptions.find((item: any) => item.status === "ACTIVE")?.id ||
            termOptions[0]?.id ||
            "";
      const classId =
        current.classId && context.classes.some((item: any) => item.id === current.classId)
          ? current.classId
          : context.classes[0]?.id || "";
      const subjectId =
        current.subjectId && context.subjects.some((item: any) => item.id === current.subjectId)
          ? current.subjectId
          : context.subjects[0]?.id || "";

      return { ...current, academicYearId, termId, classId, subjectId };
    });
  }, [contextQuery.data]);

  useEffect(() => {
    const handleYearChange = () => {
      const id = localStorage.getItem("kuralearn_active_academic_year");
      if (id) setSelector((current) => ({ ...current, academicYearId: id, termId: "" }));
    };
    window.addEventListener("academicYearChanged", handleYearChange);
    return () => window.removeEventListener("academicYearChanged", handleYearChange);
  }, []);

  const canLoadSubmission = Boolean(
    selector.classId && selector.subjectId && selector.termId && selector.assessmentType,
  );

  const submissionsQuery = useQuery({
    queryKey: [
      "mark-submissions",
      "entry",
      selector.classId,
      selector.subjectId,
      selector.termId,
      selector.assessmentType,
    ],
    queryFn: () =>
      marksWorkflowApi.submissions({
        classId: selector.classId,
        subjectId: selector.subjectId,
        termId: selector.termId,
        assessmentType: selector.assessmentType,
        pageSize: 1,
      }),
    enabled: canLoadSubmission,
  });

  useEffect(() => {
    const id = submissionsQuery.data?.items?.[0]?.id || "";
    setSubmissionId(id);
  }, [submissionsQuery.data]);

  const detailQuery = useQuery({
    queryKey: ["mark-submission-detail", submissionId],
    queryFn: () => marksWorkflowApi.submission(submissionId),
    enabled: Boolean(submissionId),
  });

  const draftKey = useMemo(() => {
    return [
      "kuralearn_marks_draft",
      selector.classId,
      selector.subjectId,
      selector.termId,
      selector.assessmentType,
    ]
      .filter(Boolean)
      .join(":");
  }, [selector.classId, selector.subjectId, selector.termId, selector.assessmentType]);

  useEffect(() => {
    setPage(1);
    setDirty(false);
    setSubmissionId("");
    setRows([]);
  }, [selector.classId, selector.subjectId, selector.termId, selector.assessmentType]);

  useEffect(() => {
    const detail = detailQuery.data;
    const students = contextQuery.data?.students ?? [];
    if (!canLoadSubmission || dirty) return;

    const local = localStorage.getItem(draftKey);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          setRows(parsed);
          setAutoSaveState("offline");
          return;
        }
      } catch {
        localStorage.removeItem(draftKey);
      }
    }

    if (detail?.records?.length) {
      setRows(
        detail.records.map((record: any) => ({
          studentId: record.studentId,
          student: record.student,
          score: record.score === null || record.score === undefined ? "" : String(record.score),
          teacherComments: record.teacherComments || "",
        })),
      );
      return;
    }

    if (students.length) {
      setRows(
        students.map((student: any) => ({
          studentId: student.id,
          student,
          score: "",
          teacherComments: "",
        })),
      );
    }
  }, [canLoadSubmission, contextQuery.data?.students, detailQuery.data, dirty, draftKey]);

  const locked =
    detailQuery.data?.submission?.isLocked || detailQuery.data?.submission?.status === "APPROVED";
  const missingRows = rows.filter((row) => row.score === "");
  const validRows = rows.filter(
    (row) => row.score !== "" && Number(row.score) <= selector.maxScore,
  );
  const average = validRows.length
    ? Math.round(
        (validRows.reduce((sum, row) => sum + Number(row.score), 0) /
          (validRows.length * selector.maxScore)) *
          1000,
      ) / 10
    : 0;

  const saveMutation = useMutation({
    mutationFn: () =>
      marksWorkflowApi.saveDraft({
        classId: selector.classId,
        subjectId: selector.subjectId,
        academicYearId: selector.academicYearId,
        termId: selector.termId,
        assessmentType: selector.assessmentType,
        maxScore: selector.maxScore,
        records: rows.map((row) => ({
          studentId: row.studentId,
          score: row.score === "" ? null : Number(row.score),
          teacherComments: row.teacherComments,
          missingReason: row.score === "" ? "Not recorded yet" : null,
        })),
      }),
    onSuccess: (detail: MarkSubmissionDetail) => {
      setSubmissionId(detail.submission.id);
      setDirty(false);
      setAutoSaveState("saved");
      localStorage.removeItem(draftKey);
      queryClient.invalidateQueries({ queryKey: ["mark-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["mark-submission-detail", detail.submission.id] });
    },
    onError: (error: any) => {
      setAutoSaveState("error");
      localStorage.setItem(draftKey, JSON.stringify(rows));
      dispatch(
        pushToast({ tone: "error", message: error?.message || "Could not save marks draft" }),
      );
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      let id = submissionId;
      if (dirty || !id) {
        const detail = await saveMutation.mutateAsync();
        id = detail.submission.id;
      }
      return marksWorkflowApi.submit(id);
    },
    onSuccess: () => {
      dispatch(pushToast({ tone: "success", message: "Marks submitted for approval" }));
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["mark-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["mark-submission-detail"] });
    },
    onError: (error: any) =>
      dispatch(pushToast({ tone: "error", message: error?.message || "Submit failed" })),
  });

  useEffect(() => {
    if (!dirty || locked || !canLoadSubmission) return;
    localStorage.setItem(draftKey, JSON.stringify(rows));
    const timer = window.setTimeout(() => {
      setAutoSaveState("saving");
      saveMutation.mutate();
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [dirty, rows, locked, canLoadSubmission, draftKey]);

  const setScore = (studentId: string, score: string) => {
    setRows((current) =>
      current.map((row) => (row.studentId === studentId ? { ...row, score } : row)),
    );
    setDirty(true);
    setAutoSaveState("idle");
  };

  const setComment = (studentId: string, comment: string) => {
    setRows((current) =>
      current.map((row) =>
        row.studentId === studentId ? { ...row, teacherComments: comment } : row,
      ),
    );
    setDirty(true);
    setAutoSaveState("idle");
  };

  const handleSave = () => {
    if (!canLoadSubmission || !selector.academicYearId) {
      dispatch(
        pushToast({
          tone: "error",
          message: "Select year, term, class, subject, and assessment first",
        }),
      );
      return;
    }
    saveMutation.mutate();
  };

  const handleSubmit = () => {
    if (missingRows.length) {
      dispatch(pushToast({ tone: "error", message: "Fill all missing marks before submitting" }));
      return;
    }
    submitMutation.mutate();
  };

  const handleExport = () => {
    const sheet = XLSX.utils.json_to_sheet(
      rows.map((row) => ({
        Student: row.student?.user?.name || row.student?.name || row.studentId,
        Code: row.student?.studentCode || "",
        Score: row.score,
        Comment: row.teacherComments,
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Marks");
    XLSX.writeFile(workbook, `${selector.assessmentType.toLowerCase()}-marks.xlsx`);
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) return;
    const imported = XLSX.utils.sheet_to_json<any>(firstSheet);
    setRows((current) =>
      current.map((row) => {
        const match = imported.find(
          (item) =>
            String(item.Code || item.StudentCode || "").trim() ===
              String(row.student?.studentCode || "").trim() ||
            String(item.Student || item.Name || "")
              .trim()
              .toLowerCase() ===
              String(row.student?.user?.name || row.student?.name || "")
                .trim()
                .toLowerCase(),
        );
        if (!match) return row;
        return {
          ...row,
          score:
            match.Score === undefined || match.Score === null ? row.score : String(match.Score),
          teacherComments: match.Comment ?? row.teacherComments,
        };
      }),
    );
    setDirty(true);
    dispatch(pushToast({ tone: "success", message: "Excel marks imported into the draft" }));
  };

  const submission = detailQuery.data?.submission || submissionsQuery.data?.items?.[0];

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Marks Entry"
          subtitle="Record draft marks, autosave progress, and submit a locked batch for school review."
          actions={
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(event) => handleImport(event.target.files?.[0])}
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={locked}
              >
                <FileSpreadsheet size={16} /> Import
              </Button>
              <Button variant="secondary" onClick={handleExport} disabled={!rows.length}>
                <Download size={16} /> Export
              </Button>
              <Button
                variant="secondary"
                onClick={handleSave}
                disabled={locked || saveMutation.isPending || !rows.length}
              >
                <Save size={16} /> Save Draft
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={locked || submitMutation.isPending || (!submissionId && !rows.length)}
              >
                <Send size={16} /> Submit
              </Button>
            </div>
          }
        />

        <MarksContextSelector
          context={contextQuery.data}
          value={selector}
          onChange={setSelector}
          disabled={saveMutation.isPending || submitMutation.isPending}
        />

        <div className="grid gap-3 md:grid-cols-4">
          <AnalyticsMetricCard
            label="Recorded"
            value={`${validRows.length}/${rows.length}`}
            helper="Valid learner scores"
            tone="emerald"
          />
          <AnalyticsMetricCard
            label="Missing"
            value={missingRows.length}
            helper="Must be completed before submission"
            tone={missingRows.length ? "amber" : "slate"}
          />
          <AnalyticsMetricCard
            label="Class Average"
            value={`${average}%`}
            helper="Draft average from visible records"
            tone="blue"
          />
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase text-slate-500">Workflow</p>
            <div className="mt-3">
              <ApprovalStatusBadge
                status={submission?.status || "DRAFT"}
                locked={submission?.isLocked}
              />
            </div>
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-slate-500">
              {autoSaveState === "offline" ? <WifiOff size={14} /> : <ShieldCheck size={14} />}
              {autoSaveState === "saving"
                ? "Autosaving..."
                : autoSaveState === "saved"
                  ? "Draft saved"
                  : autoSaveState === "error"
                    ? "Saved locally after an error"
                    : autoSaveState === "offline"
                      ? "Recovered local draft"
                      : dirty
                        ? "Unsaved local changes"
                        : "Ready"}
            </p>
          </article>
        </div>

        <MissingMarksPanel records={rows} />

        <MarksEntryGrid
          records={rows}
          maxScore={selector.maxScore}
          locked={locked}
          loading={contextQuery.isLoading || detailQuery.isLoading}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(1);
          }}
          onScoreChange={setScore}
          onCommentChange={setComment}
        />
      </div>
      <TeacherGlobalUi />
    </>
  );
}

export default TeacherMarksPage;
