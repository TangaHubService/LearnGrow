import { ShieldCheck, MapPin, AlertCircle } from "lucide-react";

export function RegistrationReview({
  formData,
  levelsOptions,
}: {
  formData: any;
  levelsOptions: any[];
}) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
        <ShieldCheck size={20} className="text-emerald-700" /> Review Registration Data
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-5">
          <h3 className="text-xs font-bold text-[#6d3eeb] uppercase tracking-wide mb-4">
            Student Profile
          </h3>

          <div className="grid gap-4 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Full Name</span>
              <span className="font-bold text-slate-900">{formData.name || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Gender</span>
              <span className="font-bold text-slate-900">{formData.gender || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Level</span>
              <span className="font-bold text-slate-900">
                {levelsOptions.find((o: any) => o.value === formData.levelId)?.label || "-"}
              </span>
            </div>

            <div className="pt-2">
              <span className="text-slate-500 font-medium block mb-1">Full Address (Rwanda)</span>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 leading-relaxed shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={12} className="text-[#6d3eeb]" />
                  <span>{formData.province || "N/A"} Province</span>
                </div>
                <div className="ml-5">
                  District: {formData.district || "N/A"} • Sector: {formData.sector || "N/A"}
                  <br />
                  Cell: {formData.cell || "N/A"} • Village: {formData.village || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {formData.parentsInfo.map((p: any, i: number) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-[#6d3eeb] uppercase tracking-wide">
                Parent / Guardian #{i + 1}
              </h3>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Name</span>
                  <span className="font-bold text-slate-900">{p.name || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Phone</span>
                  <span className="font-bold text-slate-900">{p.phone || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Relation</span>
                  <span className="font-bold text-[#6d3eeb] bg-purple-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
                    {p.relationship}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Location:{" "}
                  {p.district ? `${p.sector}, ${p.district}, ${p.province}` : "Same as student"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-xs">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <p className="font-medium leading-relaxed">
          By clicking complete, you verify that the information above is accurate and complies with
          Rwanda's school registration standards. Parents will receive an SMS with their login
          credentials (their phone number).
        </p>
      </div>
    </div>
  );
}
