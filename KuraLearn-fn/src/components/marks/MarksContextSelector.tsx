import { CustomDropdown } from "@/components/common/CustomDropdown";
import type { MarksContext } from "@/services/marksWorkflowApi";

export type MarksSelectorValue = {
  academicYearId: string;
  termId: string;
  classId: string;
  subjectId: string;
  assessmentType: string;
  maxScore: number;
};

export function MarksContextSelector({
  context,
  value,
  onChange,
  disabled,
}: {
  context?: MarksContext;
  value: MarksSelectorValue;
  onChange: (value: MarksSelectorValue) => void;
  disabled?: boolean;
}) {
  const academicYearOptions = (context?.academicYears ?? []).map((item: any) => ({
    value: item.id,
    label: item.name,
  }));
  const termOptions = (context?.terms ?? [])
    .filter((item: any) => !value.academicYearId || item.academicYearId === value.academicYearId)
    .map((item: any) => ({ value: item.id, label: item.name }));
  const classOptions = (context?.classes ?? []).map((item: any) => ({
    value: item.id,
    label: item.name,
    description: item.level?.name ?? item.levelName,
  }));
  const subjectOptions = (context?.subjects ?? []).map((item: any) => ({
    value: item.id,
    label: item.name,
    description: item.level?.name ?? item.levelName,
  }));
  const assessmentOptions = (
    context?.assessmentTypes?.length
      ? context.assessmentTypes
      : ["CAT", "EXAM", "TEST", "ASSIGNMENT"]
  ).map((item) => ({
    value: item,
    label: item.replaceAll("_", " "),
  }));

  const set = (patch: Partial<MarksSelectorValue>) => onChange({ ...value, ...patch });

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
      <CustomDropdown
        label="Academic year"
        value={value.academicYearId}
        options={academicYearOptions}
        onChange={(academicYearId) => set({ academicYearId, termId: "" })}
        placeholder="Year"
        disabled={disabled}
        clearable={false}
      />
      <CustomDropdown
        label="Term"
        value={value.termId}
        options={termOptions}
        onChange={(termId) => set({ termId })}
        placeholder="Term"
        disabled={disabled || !value.academicYearId}
        clearable={false}
      />
      <CustomDropdown
        label="Class"
        value={value.classId}
        options={classOptions}
        onChange={(classId) => set({ classId, subjectId: "" })}
        placeholder="Class"
        disabled={disabled}
        clearable={false}
      />
      <CustomDropdown
        label="Subject"
        value={value.subjectId}
        options={subjectOptions}
        onChange={(subjectId) => set({ subjectId })}
        placeholder="Subject"
        disabled={disabled || !value.classId}
        clearable={false}
      />
      <CustomDropdown
        label="Assessment"
        value={value.assessmentType}
        options={assessmentOptions}
        onChange={(assessmentType) => set({ assessmentType })}
        placeholder="Assessment"
        disabled={disabled}
        clearable={false}
      />
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Maximum
        </span>
        <input
          type="number"
          min={1}
          value={value.maxScore}
          disabled={disabled}
          onChange={(event) => set({ maxScore: Number(event.target.value) || 100 })}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100 disabled:bg-slate-50"
        />
      </label>
    </div>
  );
}
