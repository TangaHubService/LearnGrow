import { FilterX } from "lucide-react";
import { CustomDropdown } from "@/components/ModernUi";
import { Button } from "../../teacherShared";

interface LearnerFiltersProps {
  classes: Array<{ id: string; name: string }>;
  academicYears: Array<{ id: string; name: string }>;
  filters: {
    classId: string;
    stream: string;
    gender: string;
    status: string;
    disability: string;
    academicYear: string;
  };
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "GRADUATED", label: "Graduated" },
  { value: "DROPPED_OUT", label: "Dropped Out" },
  { value: "ARCHIVED", label: "Archived" },
];

const disabilityOptions = [
  { value: "true", label: "Has Disability" },
  { value: "false", label: "No Disability" },
];

const streamOptions = [
  { value: "A", label: "Stream A" },
  { value: "B", label: "Stream B" },
  { value: "C", label: "Stream C" },
];

export function LearnerFilters({
  classes,
  academicYears,
  filters,
  onChange,
  onClear,
}: LearnerFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((val) => val !== "");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="secondary"
            onClick={onClear}
            className="h-8 gap-1.5 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <FilterX size={13} />
            Clear Filters
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">Class</label>
          <CustomDropdown
            value={filters.classId}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="All Classes"
            className="border-slate-200 min-h-10 text-sm font-semibold rounded-xl bg-slate-50 hover:bg-slate-100/50"
            onChange={(val) => onChange("classId", val || "")}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">Stream</label>
          <CustomDropdown
            value={filters.stream}
            options={streamOptions}
            placeholder="All Streams"
            className="border-slate-200 min-h-10 text-sm font-semibold rounded-xl bg-slate-50 hover:bg-slate-100/50"
            onChange={(val) => onChange("stream", val || "")}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">Gender</label>
          <CustomDropdown
            value={filters.gender}
            options={genderOptions}
            placeholder="All Genders"
            className="border-slate-200 min-h-10 text-sm font-semibold rounded-xl bg-slate-50 hover:bg-slate-100/50"
            onChange={(val) => onChange("gender", val || "")}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">Status</label>
          <CustomDropdown
            value={filters.status}
            options={statusOptions}
            placeholder="All Statuses"
            className="border-slate-200 min-h-10 text-sm font-semibold rounded-xl bg-slate-50 hover:bg-slate-100/50"
            onChange={(val) => onChange("status", val || "")}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">Disability</label>
          <CustomDropdown
            value={filters.disability}
            options={disabilityOptions}
            placeholder="Disability Status"
            className="border-slate-200 min-h-10 text-sm font-semibold rounded-xl bg-slate-50 hover:bg-slate-100/50"
            onChange={(val) => onChange("disability", val || "")}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">Academic Year</label>
          <CustomDropdown
            value={filters.academicYear}
            options={academicYears.map((y) => ({ value: y.id, label: y.name }))}
            placeholder="Academic Year"
            className="border-slate-200 min-h-10 text-sm font-semibold rounded-xl bg-slate-50 hover:bg-slate-100/50"
            onChange={(val) => onChange("academicYear", val || "")}
          />
        </div>
      </div>
    </div>
  );
}
