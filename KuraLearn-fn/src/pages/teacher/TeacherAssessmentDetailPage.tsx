import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  Loader2,
  Sparkles,
  Eye,
  BarChart2,
  BookOpen,
  ListFilter,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Activity,
  History,
  FileSearch,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { assessmentApi, AssessmentSubmission, AssessmentQuestion } from "@/services/assessmentApi";
import { ConfirmModal } from "@/components/ModernUi";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

// --- Sub-components ---
import { ManualQuestionDrawer } from "./assessments/ManualQuestionDrawer";
import { QuestionRow } from "./assessments/QuestionRow";
import { QuestionDetailsDrawer } from "./assessments/QuestionDetailsDrawer";
import { EditQuestionDrawer } from "./assessments/EditQuestionDrawer";
import { AiQuestionDrawer } from "./assessments/AiQuestionDrawer";
import { SubmissionDetailsDrawer } from "./assessments/SubmissionDetailsDrawer";
import { AssessmentStats } from "./assessments/AssessmentStats";

const STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-500",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  LATE: "bg-orange-100 text-orange-700",
  MARKED: "bg-violet-100 text-violet-700",
  RETURNED: "bg-emerald-100 text-emerald-700",
};

function SubBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function SubmissionRow({ s, onView }: { s: AssessmentSubmission; onView: () => void }) {
  return (
    <div
      onClick={onView}
      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-violet-200 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
          <Users size={20} />
        </div>
        <div>
          <p className="font-bold text-slate-900">{s.student?.user?.name || "Student"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <SubBadge status={s.status} />
            {s.submittedAt && (
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {new Date(s.submittedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        {s.score !== null && (
          <div className="text-right">
            <p className="text-xl font-bold text-slate-900">{s.score}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Score</p>
          </div>
        )}
        <div className="h-8 w-8 place-items-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-violet-600 group-hover:text-white flex justify-center items-center transition-all">
          <Eye size={18} />
        </div>
      </div>
    </div>
  );
}

export default function TeacherAssessmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"submissions" | "questions" | "analytics">(
    "submissions",
  );

  // Drawers
  const [showManual, setShowManual] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [viewQ, setViewQ] = useState<AssessmentQuestion | null>(null);
  const [editQ, setEditQ] = useState<AssessmentQuestion | null>(null);
  const [viewSub, setViewSub] = useState<AssessmentSubmission | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: assessmentData, isLoading } = useQuery({
    queryKey: ["assessment-detail", id],
    queryFn: () => assessmentApi.get(id!),
    enabled: !!id,
  });

  const assessment = assessmentData?.assessment;

  const { data: subs } = useQuery({
    queryKey: ["assessment-submissions", id],
    queryFn: () => assessmentApi.getSubmissions(id!),
    enabled: !!id,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["assessment-analytics", id],
    queryFn: () => assessmentApi.analytics(id!),
    enabled: !!id,
  });

  const analytics = analyticsData?.analytics;

  const deleteMutation = useMutation({
    mutationFn: (qid: string) => assessmentApi.deleteQuestion(qid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-detail", id] });
      setDeleteId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-violet-600" size={40} />
      </div>
    );
  }

  if (!assessment) return null;

  const chartData =
    subs?.submissions
      ?.filter((s: any) => s.score !== null)
      .map((s: any) => ({
        name: s.student?.user?.name.split(" ")[0],
        score: s.score,
      })) || [];

  const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

  const statusData = [
    { name: "Submitted", value: analytics?.statusBreakdown?.SUBMITTED || 0 },
    { name: "Marked", value: analytics?.statusBreakdown?.MARKED || 0 },
    {
      name: "Pending",
      value:
        (analytics?.statusBreakdown?.NOT_STARTED || 0) +
        (analytics?.statusBreakdown?.IN_PROGRESS || 0),
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] pb-20">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              aria-label="Previous"
              onClick={() => navigate("/teacher/assessments")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {assessment.title}
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {assessment.course.subject.name} • {assessment.course.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="h-10">
              <History size={18} /> Logs
            </Button>
            <Button className="h-10">
              <Plus size={18} /> Assign
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-8">
        <AssessmentStats stats={analytics} />

        {/* Tab Navigation */}
        <div className="mt-10 flex items-center gap-8 border-b border-slate-100">
          {[
            { id: "submissions", label: "Submissions", icon: History },
            { id: "questions", label: "Questions", icon: ListFilter },
            { id: "analytics", label: "Analytics", icon: BarChart2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "border-b-2 border-violet-600 text-violet-600"
                  : "text-slate-500 hover:text-slate-600"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === "submissions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-900">Student Submissions</h2>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                    {subs?.submissions?.length || 0} Total
                  </span>
                </div>
              </div>
              {subs?.submissions?.length ? (
                <div className="grid gap-3">
                  {subs.submissions.map((s: AssessmentSubmission) => (
                    <SubmissionRow key={s.id} s={s} onView={() => setViewSub(s)} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-white py-20 text-center">
                  <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-500">
                    <FileSearch size={32} />
                  </div>
                  <h3 className="font-bold text-slate-900">No submissions yet</h3>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Students haven't started this assessment.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "questions" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Assessment Questions</h2>
                  <p className="text-xs font-bold text-slate-500">
                    Total Marks: {assessment.totalMarks}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    className="h-10 text-violet-600 border-violet-100 hover:bg-violet-50"
                    onClick={() => setShowAi(true)}
                  >
                    <Sparkles size={18} /> AI Generate
                  </Button>
                  <Button className="h-10" onClick={() => setShowManual(true)}>
                    <Plus size={18} /> Add Question
                  </Button>
                </div>
              </div>
              <div className="grid gap-3">
                {assessment.questions?.length ? (
                  assessment.questions.map((q: AssessmentQuestion) => (
                    <QuestionRow
                      key={q.id}
                      q={q}
                      onView={() => setViewQ(q)}
                      onEdit={() => setEditQ(q)}
                      onDelete={() => setDeleteId(q.id)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-white py-20 text-center">
                    <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-500">
                      <BookOpen size={32} />
                    </div>
                    <h3 className="font-bold text-slate-900">No questions added</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      Start by adding questions manually or via AI.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="rounded-2xl border-slate-100 bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <BarChartIcon size={20} className="text-violet-700" />
                    Score Distribution
                  </h3>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "16px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                        cursor={{ fill: "#f8fafc" }}
                      />
                      <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="rounded-2xl border-slate-100 bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <PieChartIcon size={20} className="text-pink-500" />
                    Submission Status
                  </h3>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Drawers & Modals */}
      <ManualQuestionDrawer
        open={showManual}
        onClose={() => setShowManual(false)}
        assessmentId={assessment.id}
        onAdded={() => qc.invalidateQueries({ queryKey: ["assessment-detail", id] })}
      />
      <AiQuestionDrawer
        open={showAi}
        onClose={() => setShowAi(false)}
        assessmentId={assessment.id}
        onAdded={() => qc.invalidateQueries({ queryKey: ["assessment-detail", id] })}
        lessonTitle={assessment.title}
        subjectName={assessment.course.subject.name}
      />
      <QuestionDetailsDrawer open={!!viewQ} onClose={() => setViewQ(null)} q={viewQ} />
      <EditQuestionDrawer
        open={!!editQ}
        onClose={() => setEditQ(null)}
        q={editQ}
        onUpdated={() => qc.invalidateQueries({ queryKey: ["assessment-detail", id] })}
      />
      {viewSub && (
        <SubmissionDetailsDrawer
          open={!!viewSub}
          onClose={() => setViewSub(null)}
          sub={viewSub}
          assessment={assessment}
        />
      )}

      <ConfirmModal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId!)}
        title="Delete Question?"
        message="This action cannot be undone and will remove the question from this assessment."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
