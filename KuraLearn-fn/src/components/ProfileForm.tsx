import { useState } from "react";
import { User, Phone, Mail, Camera, Save } from "lucide-react";
import { RwandaLocationSelector, LocationData, LocationErrors } from "./RwandaLocationSelector";
import { CustomDropdown } from "./ModernUi";

export type ProfileFormData = {
  name: string;
  email: string;
  phone?: string;
  gender?: "MALE" | "FEMALE";
  dateOfBirth?: string;
  address: LocationData;
};

export function ProfileForm({
  initialData,
  onSubmit,
  isLoading,
}: {
  initialData?: Partial<ProfileFormData>;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  isLoading?: boolean;
}) {
  const [data, setData] = useState<ProfileFormData>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    gender: initialData?.gender,
    dateOfBirth: initialData?.dateOfBirth || "",
    address: initialData?.address || {
      province: "",
      district: "",
      sector: "",
      cell: "",
      village: "",
    },
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData | string, string>>>({});

  const validate = (): boolean => {
    const newErrors: any = {};
    if (!data.name.trim()) newErrors.name = "Full name is required";
    if (!data.email.trim()) newErrors.email = "Email is required";

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
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-slate-200 grid place-items-center text-slate-500 overflow-hidden">
            <User size={48} />
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 p-2 bg-[#6d3eeb] text-white rounded-full shadow-lg hover:bg-[#5b31cb] transition-colors"
          >
            <Camera size={16} />
          </button>
        </div>
        <div className="text-center">
          <h3 className="font-bold text-slate-900">Profile Picture</h3>
          <p className="text-xs text-slate-500">JPG or PNG, max 2MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <User size={16} className="text-slate-500" /> Full Name
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className={`h-11 w-full rounded-xl border px-4 text-sm focus:outline-none focus:ring-4 ${errors.name ? "border-red-300 ring-red-50" : "border-slate-200 focus:border-[#6d3eeb] focus:ring-purple-50"}`}
            placeholder="John Doe"
          />
          {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Mail size={16} className="text-slate-500" /> Email Address
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            className={`h-11 w-full rounded-xl border px-4 text-sm focus:outline-none focus:ring-4 ${errors.email ? "border-red-300 ring-red-50" : "border-slate-200 focus:border-[#6d3eeb] focus:ring-purple-50"}`}
            placeholder="john@example.com"
          />
          {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Phone size={16} className="text-slate-500" /> Phone Number
          </label>
          <input
            type="text"
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-50"
            placeholder="078..."
          />
        </div>

        <CustomDropdown
          label="Gender"
          value={data.gender}
          onChange={(val) => setData({ ...data, gender: val as any })}
          options={[
            { value: "MALE", label: "Male" },
            { value: "FEMALE", label: "Female" },
          ]}
        />
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
          className="flex items-center gap-2 rounded-xl bg-[#6d3eeb] px-8 py-3 font-bold text-white hover:bg-[#5b31cb] transition-all shadow-lg disabled:opacity-70"
        >
          {isLoading ? "Saving..." : "Save Profile Changes"}
          {!isLoading && <Save size={18} />}
        </button>
      </div>
    </form>
  );
}
