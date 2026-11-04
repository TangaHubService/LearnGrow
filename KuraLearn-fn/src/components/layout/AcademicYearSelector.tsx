import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTeacherReferenceData } from "@/pages/teacher/teacherReference";

/** Header dropdown for the school year. Other pages listen for "academicYearChanged". */
export function AcademicYearSelector() {
  const reference = useTeacherReferenceData();

  const [selectedYearId, setSelectedYearId] = useState(() => {
    return localStorage.getItem("kuralearn_active_academic_year") || "";
  });

  useEffect(() => {
    if (reference.data.academicYears?.length && !selectedYearId) {
      const active =
        reference.data.academicYears.find((ay: any) => ay.status === "ACTIVE") ||
        reference.data.academicYears[0];
      if (active) {
        setSelectedYearId(active.id);
        localStorage.setItem("kuralearn_active_academic_year", active.id);
      }
    }
  }, [reference.data.academicYears, selectedYearId]);

  const handleYearChange = (id: string) => {
    setSelectedYearId(id);
    localStorage.setItem("kuralearn_active_academic_year", id);
    window.dispatchEvent(new Event("academicYearChanged"));
  };

  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setYearDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!reference.data.academicYears?.length) return null;

  return (
    <div ref={yearDropdownRef} className="relative hidden md:block shrink-0">
      <button
        type="button"
        onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
        className="flex items-center gap-2 h-10 px-4 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <span>
          {reference.data.academicYears.find((ay: any) => ay.id === selectedYearId)?.name ||
            "Academic Year"}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform duration-200 ${yearDropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {yearDropdownOpen && (
        <div className="absolute left-0 mt-1.5 z-50 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          {reference.data.academicYears.map((ay: any) => {
            const isActive = ay.id === selectedYearId;
            return (
              <button
                key={ay.id}
                type="button"
                onClick={() => {
                  handleYearChange(ay.id);
                  setYearDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-left transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{ay.name}</span>
                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
