import { Check } from "lucide-react";

export function WizardProgress({ step }: { step: "info" | "ai-outline" | "review" }) {
  return (
    <div className="mt-8 flex items-center gap-2">
      <ProgressStep active={step === "info"} completed={step !== "info"} label="Basic Info" />
      <div className="h-px w-8 bg-slate-200" />
      <ProgressStep
        active={step === "ai-outline"}
        completed={step === "review"}
        label="AI Outline"
      />
      <div className="h-px w-8 bg-slate-200" />
      <ProgressStep active={step === "review"} completed={false} label="Review" />
    </div>
  );
}

function ProgressStep({
  active,
  completed,
  label,
}: {
  active: boolean;
  completed: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
        flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all
        ${active ? "bg-[#6d3eeb] text-white shadow-lg" : ""}
        ${completed ? "bg-emerald-700 text-white" : ""}
        ${!active && !completed ? "bg-slate-100 text-slate-500" : ""}
      `}
      >
        {completed ? <Check size={14} /> : active ? "•" : ""}
      </div>
      <span
        className={`text-xs font-bold transition-all ${active ? "text-[#6d3eeb]" : "text-slate-500"}`}
      >
        {label}
      </span>
    </div>
  );
}
