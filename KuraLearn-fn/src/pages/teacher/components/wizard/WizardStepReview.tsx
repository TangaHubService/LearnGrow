import { BookOpen, AlertCircle, ArrowLeft, Loader2, Check } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

export function WizardStepReview({
  info,
  refData,
  isSubmitting,
  onBack,
  onFinalize,
}: {
  info: any;
  refData: any;
  isSubmitting: boolean;
  onBack: () => void;
  onFinalize: () => void;
}) {
  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
      <h2 className="mb-6 text-lg font-bold text-slate-900">3. Review & Launch</h2>

      <div className="space-y-6">
        <div className="rounded-xl bg-slate-50 p-6">
          <div className="flex items-center gap-3 text-[#6d3eeb]">
            <BookOpen size={20} />
            <h3 className="text-base font-bold">Course Summary</h3>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Title</p>
              <p className="text-sm font-semibold text-slate-900">{info.title}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Subject/Level
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {refData?.subjects.find((s: any) => s.id === info.subjectId)?.name} •
                {refData?.levels.find((l: any) => l.id === info.levelId)?.name}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <div className="flex gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <p>
              Your course will be created as a <strong>Draft</strong>. You can continue adding
              notes, quizzes, and multimedia once you enter the course editor.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
          <Button onClick={onFinalize} disabled={isSubmitting} className="h-12 px-10">
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" /> Creating Course...
              </>
            ) : (
              <>
                Launch Course <Check size={18} className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
