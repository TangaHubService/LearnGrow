import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft, Save, AlertCircle } from "lucide-react";
import {
  studentManagementApi,
  StudentRegistrationPayload,
  ParentInfo,
} from "@/services/studentManagementService";
import { useTeacherReferenceData } from "@/pages/teacher/teacherReference";

// --- Sub-components ---
import { RegistrationStep1 } from "./components/RegistrationStep1";
import { RegistrationStep2 } from "./components/RegistrationStep2";
import { RegistrationStep3 } from "./components/RegistrationStep3";
import { RegistrationStep4 } from "./components/RegistrationStep4";
import { RegistrationReview } from "./components/RegistrationReview";
import { RegistrationSuccess } from "./components/RegistrationSuccess";

type Step = 1 | 2 | 3 | 4 | 5;
const INITIAL_PARENT: ParentInfo = {
  name: "",
  phone: "",
  nationalId: "",
  relationship: "FATHER",
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
};

export function StudentRegistrationPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { data: refData, isLoading: isRefLoading } = useTeacherReferenceData();

  const [formData, setFormData] = useState<StudentRegistrationPayload>({
    name: "",
    gender: undefined,
    nationality: "Rwandan",
    nationalId: "",
    birthCertificateNumber: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    levelId: "",
    classId: "",
    stream: "",
    boardingStatus: "DAY",
    hasDisability: false,
    parentsInfo: [{ ...INITIAL_PARENT }],
  });

  useEffect(() => {
    if (refData?.levels?.length > 0 && !formData.levelId)
      setFormData((p) => ({ ...p, levelId: refData.levels[0].id }));
  }, [refData, formData.levelId]);

  const updateForm = (updates: Partial<StudentRegistrationPayload>) =>
    setFormData((p) => ({ ...p, ...updates }));
  const updateParent = (index: number, updates: Partial<ParentInfo>) =>
    setFormData((p) => {
      const np = [...p.parentsInfo];
      np[index] = { ...np[index], ...updates };
      return { ...p, parentsInfo: np };
    });

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.name.trim()) return setError("Student name is required.");
      if (!formData.gender) return setError("Gender is required.");
      if (!formData.province || !formData.district || !formData.sector)
        return setError("Student location is required.");
    }
    if (step === 2 && !formData.levelId) return setError("Level is required.");
    if (step === 4) {
      const p1 = formData.parentsInfo[0];
      if (!p1.name.trim() || !p1.phone?.trim() || !p1.relationship)
        return setError("Parent 1 details are required.");
      if (formData.parentsInfo.length > 1) {
        const p2 = formData.parentsInfo[1];
        if ((p2.name.trim() || p2.phone?.trim()) && (!p2.name.trim() || !p2.phone?.trim()))
          return setError("Parent 2 details are incomplete.");
      }
    }
    setStep((s) => Math.min(s + 1, 5) as Step);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      formData.parentsInfo.forEach((p, i) => {
        if (p.nationalId && p.nationalId.length !== 16)
          throw new Error(`Parent ${i + 1} National ID must be 16 digits.`);
      });
      await studentManagementApi.register(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) return <RegistrationSuccess onReset={() => window.location.reload()} />;

  const levelsOptions = (refData?.levels || []).map((l: any) => ({ value: l.id, label: l.name }));
  const classesOptions = (refData?.classes || [])
    .filter((c: any) => !formData.levelId || c.levelId === formData.levelId)
    .map((c: any) => ({ value: c.id, label: c.name }));

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Student Registration</h1>
          <p className="mt-2 text-slate-500 italic">CBC Rwanda Compliant Workflow</p>
        </div>
        <Link
          to="/admin/students"
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft size={16} /> Back
        </Link>
      </header>

      <div className="mb-8 flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} className="flex flex-col items-center flex-1">
            <div
              className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition-all ${step === num ? "bg-[#6d3eeb] text-white ring-4 ring-purple-100 scale-110" : step > num ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}
            >
              {step > num ? "✓" : num}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-700 border border-red-100">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {step === 1 && (
          <RegistrationStep1 formData={formData} updateForm={updateForm} error={error} />
        )}
        {step === 2 && (
          <RegistrationStep2
            formData={formData}
            updateForm={updateForm}
            isRefLoading={isRefLoading}
            levelsOptions={levelsOptions}
            classesOptions={classesOptions}
          />
        )}
        {step === 3 && <RegistrationStep3 formData={formData} updateForm={updateForm} />}
        {step === 4 && (
          <RegistrationStep4
            formData={formData}
            addParent={() =>
              setFormData((p) => ({
                ...p,
                parentsInfo: [...p.parentsInfo, { ...INITIAL_PARENT, relationship: "MOTHER" }],
              }))
            }
            removeParent={(i) =>
              setFormData((p) => ({
                ...p,
                parentsInfo: p.parentsInfo.filter((_, idx) => idx !== i),
              }))
            }
            updateParent={updateParent}
            handleParentLocationChange={(i, loc) => updateParent(i, loc)}
          />
        )}
        {step === 5 && <RegistrationReview formData={formData} levelsOptions={levelsOptions} />}

        <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
          <button
            onClick={() => (step === 1 ? null : setStep((s) => Math.max(s - 1, 1) as Step))}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            <ChevronLeft size={20} /> {step === 1 ? "Cancel" : "Go Back"}
          </button>
          <button
            onClick={step < 5 ? nextStep : handleSubmit}
            disabled={loading}
            className={`group flex items-center gap-2 rounded-xl px-8 py-3 font-bold text-white transition-all shadow-lg active:scale-95 ${step < 5 ? "bg-[#6d3eeb] hover:bg-[#5b31cb]" : "bg-emerald-700 hover:bg-emerald-700"}`}
          >
            {step < 5 ? "Continue" : loading ? "Registering..." : "Finalize & Register"}{" "}
            {step < 5 ? <ChevronRight size={20} /> : <Save size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
