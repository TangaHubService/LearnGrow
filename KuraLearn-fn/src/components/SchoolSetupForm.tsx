import { useState } from "react";
import { School, Building2, Globe, Save, Info } from "lucide-react";
import { RwandaLocationSelector, LocationData } from "./RwandaLocationSelector";
import { CustomDropdown } from "./ModernUi";

export type SchoolFormData = {
  name: string;
  type: "PUBLIC" | "PRIVATE" | "COMMUNITY";
  address: LocationData;
  phone?: string;
  email?: string;
  website?: string;
};

export function SchoolSetupForm({
  initialData,
  onSubmit,
  isLoading,
}: {
  initialData?: Partial<SchoolFormData>;
  onSubmit: (data: SchoolFormData) => Promise<void>;
  isLoading?: boolean;
}) {
  const [data, setData] = useState<SchoolFormData>({
    name: initialData?.name || "",
    type: initialData?.type || "PUBLIC",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    website: initialData?.website || "",
    address: initialData?.address || {
      province: "",
      district: "",
      sector: "",
      cell: "",
      village: "",
    },
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const validate = (): boolean => {
    const newErrors: any = {};
    if (!data.name.trim()) newErrors.name = "School name is required";

    // Location validation
    if (!data.address.province) newErrors.province = "Province is required";
    if (!data.address.district) newErrors.district = "District is required";
    if (!data.address.sector) newErrors.sector = "Sector is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold text-blue-900 text-sm">School Configuration</h4>
          <p className="text-xs text-blue-700 mt-1">
            This information will be used for official reports and CBC compliance in Rwanda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <School size={16} className="text-slate-500" /> School Name
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className={`h-11 w-full rounded-xl border px-4 text-sm focus:outline-none focus:ring-4 ${errors.name ? "border-red-300 ring-red-50" : "border-slate-200 focus:border-[#6d3eeb] focus:ring-purple-50"}`}
            placeholder="e.g. Kigali International School"
          />
          {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
        </div>

        <CustomDropdown
          label="School Type"
          value={data.type}
          onChange={(val) => setData({ ...data, type: val as any })}
          options={[
            { value: "PUBLIC", label: "Public School" },
            { value: "PRIVATE", label: "Private School" },
            { value: "COMMUNITY", label: "Community School" },
          ]}
        />

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Building2 size={16} className="text-slate-500" /> Contact Phone
          </label>
          <input
            type="text"
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50"
            placeholder="Official school phone"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Globe size={16} className="text-slate-500" /> Website (Optional)
          </label>
          <input
            type="text"
            value={data.website}
            onChange={(e) => setData({ ...data, website: e.target.value })}
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <RwandaLocationSelector
          value={data.address}
          onChange={(address) => setData({ ...data, address })}
          errors={{
            province: errors.province,
            district: errors.district,
            sector: errors.sector,
          }}
        />
      </div>

      <div className="pt-8 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-emerald-700 px-8 py-3 font-bold text-white hover:bg-emerald-800 transition-all shadow-lg disabled:opacity-70"
        >
          {isLoading ? "Saving..." : "Update School Setup"}
          {!isLoading && <Save size={18} />}
        </button>
      </div>
    </form>
  );
}
