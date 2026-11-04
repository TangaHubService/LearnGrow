import { GraduationCap } from "lucide-react";
import { CustomDropdown } from "@/components/ModernUi";

export function RegistrationStep2({
  formData,
  updateForm,
  isRefLoading,
  levelsOptions,
  classesOptions,
}: {
  formData: any;
  updateForm: (updates: any) => void;
  isRefLoading: boolean;
  levelsOptions: any[];
  classesOptions: any[];
}) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
        <GraduationCap size={20} className="text-[#6d3eeb]" /> Academic Placement
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CustomDropdown
          label="Education Level *"
          value={formData.levelId}
          loading={isRefLoading}
          onChange={(val) => updateForm({ levelId: val || "" })}
          options={levelsOptions}
          placeholder="e.g. Primary 1"
        />

        <CustomDropdown
          label="Class (Optional)"
          value={formData.classId}
          onChange={(val) => updateForm({ classId: val })}
          options={classesOptions}
          disabled={!formData.levelId}
          placeholder="Assign to a class"
        />

        <CustomDropdown
          label="Boarding Status *"
          value={formData.boardingStatus}
          onChange={(val) => updateForm({ boardingStatus: val })}
          options={[
            { value: "DAY", label: "Day Scholar" },
            { value: "BOARDING", label: "Boarding" },
          ]}
        />

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Previous School</span>
          <input
            type="text"
            value={formData.previousSchool || ""}
            onChange={(e) => updateForm({ previousSchool: e.target.value })}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all"
            placeholder="Last school attended"
          />
        </label>
      </div>
    </div>
  );
}
