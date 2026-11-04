import { User, Plus, Trash2, Phone, FileText, MapPin } from "lucide-react";
import { CustomDropdown } from "@/components/ModernUi";
import { RwandaLocationSelector } from "@/components/RwandaLocationSelector";

export function RegistrationStep4({
  formData,
  addParent,
  removeParent,
  updateParent,
  handleParentLocationChange,
}: {
  formData: any;
  addParent: () => void;
  removeParent: (index: number) => void;
  updateParent: (index: number, updates: any) => void;
  handleParentLocationChange: (index: number, loc: any) => void;
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <User size={20} className="text-[#6d3eeb]" /> Parents & Guardians
        </h2>
        {formData.parentsInfo.length < 2 && (
          <button
            onClick={addParent}
            className="text-sm font-bold text-[#6d3eeb] hover:text-[#5b31cb] flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-lg transition-all"
          >
            <Plus size={16} /> Add Second Parent
          </button>
        )}
      </div>

      <div className="space-y-12">
        {formData.parentsInfo.map((parent: any, index: number) => (
          <div
            key={index}
            className="relative p-6 rounded-2xl border border-slate-100 bg-slate-50/30"
          >
            <div className="absolute -top-3 left-6 bg-white px-3 py-0.5 rounded-full border border-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Parent / Guardian #{index + 1}
            </div>

            {index > 0 && (
              <button
                aria-label="Delete"
                onClick={() => removeParent(index)}
                className="absolute -top-3 -right-3 h-8 w-8 grid place-items-center rounded-full bg-white border border-red-100 text-red-600 shadow-sm hover:bg-red-50 transition-all"
              >
                <Trash2 size={16} />
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Full Name *</span>
                <input
                  type="text"
                  value={parent.name}
                  onChange={(e) => updateParent(index, { name: e.target.value })}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all"
                />
              </label>

              <CustomDropdown
                label="Relationship *"
                value={parent.relationship}
                onChange={(val) => updateParent(index, { relationship: val })}
                options={[
                  { value: "FATHER", label: "Father" },
                  { value: "MOTHER", label: "Mother" },
                  { value: "GUARDIAN", label: "Guardian" },
                  { value: "OTHER", label: "Other" },
                ]}
              />

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Phone size={16} /> Phone Number *
                </span>
                <input
                  type="text"
                  value={parent.phone}
                  onChange={(e) => updateParent(index, { phone: e.target.value })}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all"
                  placeholder="078..."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FileText size={16} /> National ID
                </span>
                <input
                  type="text"
                  maxLength={16}
                  value={parent.nationalId}
                  onChange={(e) => updateParent(index, { nationalId: e.target.value })}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all"
                  placeholder="16 digits"
                />
              </label>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-4 flex items-center gap-2">
                <MapPin size={12} /> Parent Location
              </h3>
              <RwandaLocationSelector
                value={{
                  province: parent.province,
                  district: parent.district,
                  sector: parent.sector,
                  cell: parent.cell,
                  village: parent.village,
                }}
                onChange={(loc) => handleParentLocationChange(index, loc)}
                requiredLevels={[]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
