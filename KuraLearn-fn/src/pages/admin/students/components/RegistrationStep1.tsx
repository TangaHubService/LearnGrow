import { User, FileText } from "lucide-react";
import { RwandaLocationSelector, LocationData } from "@/components/RwandaLocationSelector";
import { CustomDropdown } from "@/components/ModernUi";

export function RegistrationStep1({
  formData,
  updateForm,
  error,
}: {
  formData: any;
  updateForm: (updates: any) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
        <User size={20} className="text-[#6d3eeb]" /> Student Identification
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Full Name *</span>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateForm({ name: e.target.value })}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all"
            placeholder="Official name as per birth certificate"
          />
        </label>

        <CustomDropdown
          label="Gender *"
          value={formData.gender}
          onChange={(val) => updateForm({ gender: val as any })}
          options={[
            { value: "MALE", label: "Male" },
            { value: "FEMALE", label: "Female" },
          ]}
        />

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Date of Birth</span>
          <input
            type="date"
            value={formData.dateOfBirth || ""}
            onChange={(e) => updateForm({ dateOfBirth: e.target.value })}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700 flex items-center gap-2">
            <FileText size={16} /> National ID / Child ID
          </span>
          <input
            type="text"
            value={formData.nationalId || ""}
            onChange={(e) => updateForm({ nationalId: e.target.value })}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all"
            placeholder="16 digits (if available)"
          />
        </label>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50">
        <RwandaLocationSelector
          value={{
            province: formData.province,
            district: formData.district,
            sector: formData.sector,
            cell: formData.cell,
            village: formData.village,
          }}
          onChange={(loc: LocationData) => updateForm({ ...loc })}
          errors={
            error?.toLowerCase().includes("province") || error?.toLowerCase().includes("address")
              ? {
                  province: !formData.province ? "Required" : undefined,
                  district: !formData.district ? "Required" : undefined,
                  sector: !formData.sector ? "Required" : undefined,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
