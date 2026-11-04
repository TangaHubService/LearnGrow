import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { courseApi } from "@/services/courseApi";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { AppDrawer, StatusBadge } from "@/components/ModernUi";
import { RichTextEditor, RichTextViewer } from "@/components/editor/RichTextEditor";

// ─── Main Page ──────────────────────────────────────────────────

export function StudentAssignmentsPage() {
  const queryClient = useQueryClient();
  const [drawer, setDrawer] = useState<{ id: string; title: string; description: string } | null>(
    null,
  );
  const [submissionForm, setSubmissionForm] = useState({ content: "" });

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ["student-courses"],
    queryFn: () => courseApi.mine(),
  });

  const courses = coursesData?.courses ?? [];
  const assignments = courses.flatMap((c) => (c as any).assignments || []);

  const submitMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      courseApi.submitAssignment(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-courses"] });
      setDrawer(null);
      setSubmissionForm({ content: "" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#6d3eeb]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Assignments</h1>
        <p className="mt-1 font-bold text-slate-500">
          Track and submit your projects and homework.
        </p>
      </div>

      <div className="grid gap-4">
        {assignments.length === 0 ? (
          <Card className="py-16 text-center">
            <FileText size={48} className="mx-auto text-slate-500" />
            <p className="mt-4 text-xl font-bold text-slate-600">No assignments yet</p>
            <p className="mt-1 text-slate-500">
              Your teachers haven't posted any assignments for your courses.
            </p>
          </Card>
        ) : (
          assignments.map((a: any) => {
            const submission = a.submissions?.[0];
            const isSubmitted = !!submission;

            return (
              <Card
                key={a.id}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-xl ${isSubmitted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{a.title}</h3>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {a.course?.title || "—"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-500" />
                        Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No deadline"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-slate-500" />
                        {a.points} Points
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0">
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge value={isSubmitted ? "SUBMITTED" : "PENDING"} />
                    {isSubmitted && (
                      <span className="text-[10px] font-bold text-slate-500">
                        Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Button
                    variant={isSubmitted ? "secondary" : "primary"}
                    onClick={() =>
                      setDrawer({ id: a.id, title: a.title, description: a.description })
                    }
                  >
                    {isSubmitted ? "View / Edit" : "Start Assignment"} <ArrowRight size={16} />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Submission Drawer */}
      <AppDrawer open={!!drawer} title={drawer?.title} size="3xl" onClose={() => setDrawer(null)}>
        <div className="space-y-6">
          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Instructions
            </h4>
            <RichTextViewer content={drawer?.description} />
          </section>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
              Your Submission
            </h4>
            <RichTextEditor
              value={submissionForm.content}
              onChange={(val) => setSubmissionForm({ content: val })}
              placeholder="Write your answer or project content here..."
              minHeight="400px"
            />

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDrawer(null)}>
                Cancel
              </Button>
              <Button
                disabled={submitMutation.isPending || !submissionForm.content}
                onClick={() =>
                  drawer &&
                  submitMutation.mutate({ id: drawer.id, content: submissionForm.content })
                }
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Assignment"}
              </Button>
            </div>
          </div>
        </div>
      </AppDrawer>
    </div>
  );
}
