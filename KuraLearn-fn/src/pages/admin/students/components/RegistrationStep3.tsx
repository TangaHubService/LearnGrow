import { ShieldCheck } from "lucide-react";

export function RegistrationStep3({
  formData,
  updateForm,
}: {
  formData: any;
  updateForm: (updates: any) => void;
}) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
        <ShieldCheck size={20} className="text-[#6d3eeb]" /> Inclusive Education & Health
      </h2>

      <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 transition-all hover:border-purple-100">
        <input
          type="checkbox"
          id="hasDisability"
          checked={formData.hasDisability}
          onChange={(e) => updateForm({ hasDisability: e.target.checked })}
          className="h-6 w-6 rounded-lg border-slate-300 text-[#6d3eeb] focus:ring-[#6d3eeb] cursor-pointer"
        />
        <label htmlFor="hasDisability" className="font-bold text-slate-900 cursor-pointer">
          This student has a disability or special learning need
        </label>
      </div>

      {formData.hasDisability && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pl-6 border-l-4 border-[#6d3eeb] py-2 animate-in slide-in-from-left-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Disability Type</span>
            <input
              type="text"
              value={formData.disabilityType || ""}
              onChange={(e) => updateForm({ disabilityType: e.target.value })}
              className="h-12 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all"
              placeholder="e.g. Visual Impairment"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Special Support Needed
            </span>
            <input
              type="text"
              value={formData.specialSupportNeeds || ""}
              onChange={(e) => updateForm({ specialSupportNeeds: e.target.value })}
              className="h-12 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all"
              placeholder="e.g. Braille, Sign Language"
            />
          </label>
        </div>
      )}
    </div>
  );
}
