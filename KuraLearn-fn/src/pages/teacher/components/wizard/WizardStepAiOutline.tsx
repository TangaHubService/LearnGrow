import { Sparkles, Loader2, ArrowRight, Layers, FileText } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

export function WizardStepAiOutline({
  outline,
  isGenerating,
  onGenerate,
  onSkip,
}: {
  outline: any[];
  isGenerating: boolean;
  onGenerate: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card className="bg-[#6d3eeb] text-white">
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <Sparkles size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold">AI Course Architect</h2>
          <p className="mt-2 max-w-md text-purple-100">
            We can analyze your course topic and generate a full structure of units and lessons
            tailored to the curriculum.
          </p>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="mt-8 h-12 bg-white text-[#6d3eeb] hover:bg-slate-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" /> Generating...
              </>
            ) : (
              "Generate My Outline"
            )}
          </Button>
          <button
            onClick={onSkip}
            className="mt-4 text-sm font-semibold text-purple-200 hover:text-white"
          >
            Skip for now, I'll build it manually
          </button>
        </div>
      </Card>

      {outline.length > 0 && (
        <Card className="border-none shadow-lg ring-1 ring-slate-100">
          <div className="mb-8 flex items-center justify-between border-b border-slate-50 pb-6">
            <div>
              <div className="flex items-center gap-2 text-[#6d3eeb] mb-1">
                <Sparkles size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  AI Architect Output
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Your Course Structure
              </h2>
            </div>
            <Button onClick={onSkip} className="h-12 px-6 shadow-lg">
              Continue to Review <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>

          <div className="space-y-6">
            {outline.map((section, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:border-[#6d3eeb]/30 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#6d3eeb] group-hover:bg-[#6d3eeb] group-hover:text-white">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-none mb-1">
                      {section.heading}
                    </h3>
                    {section.content && (
                      <p className="text-xs font-medium text-slate-500">{section.content}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 ml-14 grid gap-3 sm:grid-cols-2">
                  {section.items?.map((item: string, lIdx: number) => (
                    <div
                      key={lIdx}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/50">
                        <FileText size={12} />
                      </div>
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
