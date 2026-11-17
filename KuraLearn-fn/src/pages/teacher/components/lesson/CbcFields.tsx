import {
  useCurriculumReference,
  useSyllabusUnits,
  type SyllabusUnit,
} from "@/services/syllabusApi";
import { useT } from "@/i18n/I18nContext";

type CbcFormData = {
  subjectId?: string;
  syllabusUnitId?: string | null;
  topic?: string;
  learningObjectives?: string;
  genericCompetencies?: string[];
  crossCuttingIssues?: string[];
};

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100";

function toggle(list: string[] | undefined, value: string) {
  const current = list ?? [];
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function ChipGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold text-slate-600">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3 py-1.5 text-left text-xs font-semibold transition ${
                active
                  ? "border-[#6d3eeb] bg-[#6d3eeb] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#6d3eeb]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Links a lesson plan to a national syllabus unit and records the CBC competences
 * and cross-cutting issues it develops. Picking a unit pre-fills the rest.
 */
export function CbcFields<T extends CbcFormData>({
  formData,
  setFormData,
}: {
  formData: T;
  setFormData: (updater: (prev: T) => T) => void;
}) {
  const t = useT();
  const reference = useCurriculumReference();
  const syllabus = useSyllabusUnits(formData.subjectId);
  const units = syllabus.data?.units ?? [];
  const isSample = units.some((unit) => unit.source === "SAMPLE");
  const selectedUnit = units.find((unit) => unit.id === formData.syllabusUnitId);

  const applyUnit = (unit: SyllabusUnit | undefined) => {
    setFormData((prev) => ({
      ...prev,
      syllabusUnitId: unit?.id ?? null,
      ...(unit && {
        topic: prev.topic || unit.title,
        learningObjectives: prev.learningObjectives || unit.keyUnitCompetence,
        genericCompetencies: prev.genericCompetencies?.length
          ? prev.genericCompetencies
          : unit.genericCompetences,
        crossCuttingIssues: prev.crossCuttingIssues?.length
          ? prev.crossCuttingIssues
          : unit.crossCuttingIssues,
      }),
    }));
  };

  return (
    <section aria-labelledby="cbc-heading" className="sm:col-span-2">
      <h2
        id="cbc-heading"
        className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500"
      >
        {t("Rwanda CBC alignment")}
      </h2>
      <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 sm:p-5">
        <div className="sm:col-span-2">
          <label htmlFor="cbc-unit" className="mb-1.5 block text-xs font-bold text-slate-600">
            {t("Syllabus unit")}
          </label>
          <select
            id="cbc-unit"
            className={inputClass}
            disabled={!formData.subjectId || syllabus.isLoading}
            value={formData.syllabusUnitId ?? ""}
            onChange={(e) => applyUnit(units.find((unit) => unit.id === e.target.value))}
          >
            <option value="">
              {!formData.subjectId
                ? t("Select a subject first")
                : syllabus.isLoading
                  ? t("Loading syllabus…")
                  : units.length
                    ? t("Not linked to a unit")
                    : t("No syllabus loaded for this subject yet")}
            </option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {t("Unit")} {unit.number}: {unit.title}
              </option>
            ))}
          </select>
          {selectedUnit && (
            <p className="mt-2 rounded-xl bg-white p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-100">
              <span className="font-bold text-slate-800">{t("Key unit competence:")} </span>
              {selectedUnit.keyUnitCompetence}
            </p>
          )}
          {isSample && (
            <p className="mt-1.5 text-[11px] font-medium text-amber-700">
              {t("Sample syllabus. The official REB units replace it once loaded.")}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="cbc-topic" className="mb-1.5 block text-xs font-bold text-slate-600">
            {t("Topic")}
          </label>
          <input
            id="cbc-topic"
            type="text"
            value={formData.topic || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
            placeholder={t("e.g. Parts of a flower")}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="cbc-objectives" className="mb-1.5 block text-xs font-bold text-slate-600">
            {t("Learning objectives")}
          </label>
          <textarea
            id="cbc-objectives"
            value={formData.learningObjectives || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, learningObjectives: e.target.value }))
            }
            placeholder={t("What should learners be able to do by the end of the lesson?")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
            rows={2}
          />
        </div>

        <div className="sm:col-span-2">
          <ChipGroup
            legend="Generic competences"
            options={reference.data?.genericCompetences ?? []}
            selected={formData.genericCompetencies ?? []}
            onToggle={(value) =>
              setFormData((prev) => ({
                ...prev,
                genericCompetencies: toggle(prev.genericCompetencies, value),
              }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <ChipGroup
            legend="Cross-cutting issues"
            options={reference.data?.crossCuttingIssues ?? []}
            selected={formData.crossCuttingIssues ?? []}
            onToggle={(value) =>
              setFormData((prev) => ({
                ...prev,
                crossCuttingIssues: toggle(prev.crossCuttingIssues, value),
              }))
            }
          />
        </div>
      </div>
    </section>
  );
}
