import { ArrowRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { CustomDropdown } from "@/components/ModernUi";

export function WizardStepInfo({
  info,
  setInfo,
  refData,
  refLoading,
  onSubmit,
}: {
  info: any;
  setInfo: any;
  refData: any;
  refLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="mb-6 text-lg font-bold text-slate-900">1. Course Basics</h2>
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Course Title *</label>
          <input
            value={info.title}
            onChange={(e) => setInfo({ ...info, title: e.target.value })}
            required
            placeholder="e.g. Advanced Calculus"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <CustomDropdown
            label="Subject *"
            value={info.subjectId}
            options={refData?.subjects.map((s: any) => ({ value: s.id, label: s.name })) || []}
            placeholder="Select Subject"
            onChange={(val) => setInfo({ ...info, subjectId: val || "" })}
            loading={refLoading}
          />
          <CustomDropdown
            label="Level *"
            value={info.levelId}
            options={refData?.levels.map((l: any) => ({ value: l.id, label: l.name })) || []}
            placeholder="Select Level"
            onChange={(val) => setInfo({ ...info, levelId: val || "" })}
            loading={refLoading}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Brief Description</label>
          <textarea
            value={info.description}
            onChange={(e) => setInfo({ ...info, description: e.target.value })}
            rows={4}
            placeholder="What will students learn?"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="h-12 px-8">
            Next Step <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
