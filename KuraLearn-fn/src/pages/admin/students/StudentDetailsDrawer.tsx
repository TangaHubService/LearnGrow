import { useState, useEffect } from "react";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useAppDispatch } from "@/store/appStore";
import { pushToast } from "@/store/uiSlice";
import { LinkParentForm } from "./LinkParentForm";
import { AppDrawer, ReadableDetails, DetailSection, StatusBadge } from "@/components/ModernUi";
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Activity,
  BookOpen,
  AlertCircle,
  Calendar,
  FileCheck,
  History,
} from "lucide-react";
import { studentManagementApi } from "@/services/studentManagementService";

export function StudentDetailsDrawer({
  student: initialStudent,
  studentId,
  open,
  onClose,
}: {
  student?: any;
  studentId?: string;
  open: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "academic" | "medical" | "parents" | "progress"
  >("overview");
  const [student, setStudent] = useState<any>(initialStudent);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const [parentToRemove, setParentToRemove] = useState<{ id: string; name: string } | null>(null);

  const fetchDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await studentManagementApi.getDetails(id);
      if (res.success) setStudent(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && studentId) {
      fetchDetails(studentId);
    } else if (open && initialStudent) {
      setStudent(initialStudent);
    }
  }, [open, studentId, initialStudent]);

  if (!open) return null;
  if (loading)
    return (
      <AppDrawer open={open} onClose={onClose} title="Loading Student Profile..." size="2xl">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6d3eeb] border-t-transparent"></div>
        </div>
      </AppDrawer>
    );
  if (!student) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: GraduationCap },
    { id: "academic", label: "Academic", icon: BookOpen },
    { id: "progress", label: "Progress & Assessments", icon: History },
    { id: "medical", label: "Medical & Support", icon: Activity },
    { id: "parents", label: "Parents/Guardians", icon: Phone },
  ] as const;

  const user = student.user || {};

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Student Profile"
      subtitle={student.studentCode}
      size="2xl"
    >
      <div className="flex flex-col gap-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-purple-100 text-[#6d3eeb] shadow-sm border-2 border-white">
            {student.avatar ? (
              <img src={student.avatar} className="h-full w-full rounded-full object-cover" />
            ) : (
              <GraduationCap size={40} />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin size={16} className="text-[#6d3eeb]" />{" "}
                {student.district || "Unknown District"}
              </span>
              <span className="flex items-center gap-1">
                <Mail size={16} className="text-[#6d3eeb]" /> {user.email || "No Email"}
              </span>
              <StatusBadge
                value={student.status || user.status}
                tone={student.status === "ACTIVE" ? "success" : "warning"}
              />
            </div>
            {student.hasDisability && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                <AlertCircle size={14} /> Special Educational Needs
              </div>
            )}
          </div>
        </div>

        {/* Custom Tabs */}
        <div tabIndex={0} className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#6d3eeb] text-[#6d3eeb]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="pb-8">
          {activeTab === "overview" && (
            <div className="grid gap-6 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2">
              <ReadableDetails
                title="Personal Information"
                record={{
                  Gender: student.gender || "Unknown",
                  DateOfBirth: student.dateOfBirth
                    ? new Date(student.dateOfBirth).toLocaleDateString()
                    : "N/A",
                  Nationality: student.nationality,
                  NationalID: student.nationalId || "N/A",
                  BirthCertificate: student.birthCertificateNumber || "N/A",
                  Language: student.language,
                }}
              />
              <ReadableDetails
                title="Location"
                record={{
                  Province: student.province,
                  District: student.district,
                  Sector: student.sector,
                  Cell: student.cell,
                  Village: student.village,
                }}
              />
            </div>
          )}

          {activeTab === "academic" && (
            <div className="grid gap-6 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2">
              <ReadableDetails
                title="Enrollment"
                record={{
                  Class: student.class?.name || "Unassigned",
                  Level: student.level?.name || "N/A",
                  Stream: student.stream || "N/A",
                  BoardingStatus: student.boardingStatus || "N/A",
                  AdmissionDate: student.admissionDate
                    ? new Date(student.admissionDate).toLocaleDateString()
                    : "N/A",
                  PreviousSchool: student.previousSchool || "N/A",
                }}
              />
            </div>
          )}

          {activeTab === "progress" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailSection title="Recent Learning Activity">
                  <div className="space-y-3">
                    {student.lessonProgress?.length > 0 ? (
                      student.lessonProgress.map((p: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                              <BookOpen size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 line-clamp-1">
                                {p.lesson?.title || "Lesson"}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {new Date(p.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <StatusBadge
                            value={p.status}
                            tone={p.status === "COMPLETED" ? "success" : "warning"}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        No learning activity recorded.
                      </p>
                    )}
                  </div>
                </DetailSection>

                <DetailSection title="Recent Assessments">
                  <div className="space-y-3">
                    {student.assessmentSubmissions?.length > 0 ? (
                      student.assessmentSubmissions.map((s: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 text-[#6d3eeb] rounded-lg">
                              <FileCheck size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 line-clamp-1">
                                {s.assessment?.title || "Assessment"}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Score:{" "}
                                <span className="font-bold text-[#6d3eeb]">{s.score || 0}%</span>
                              </p>
                            </div>
                          </div>
                          <StatusBadge value={s.status} tone="success" />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        No assessment submissions recorded.
                      </p>
                    )}
                  </div>
                </DetailSection>
              </div>
            </div>
          )}

          {activeTab === "medical" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <DetailSection title="Disability & Inclusive Education">
                {student.hasDisability ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-2">
                        <AlertCircle size={16} /> Disability Type
                      </h4>
                      <p className="text-amber-800 text-sm">
                        {student.disabilityType || "Not specified"}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                        <Activity size={16} /> Support Needs
                      </h4>
                      <p className="text-blue-800 text-sm">
                        {student.specialSupportNeeds || "Not specified"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No disabilities reported.</p>
                )}
                {student.inclusiveEducationNotes && (
                  <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-700 mb-1">Inclusive Education Notes</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {student.inclusiveEducationNotes}
                    </p>
                  </div>
                )}
              </DetailSection>

              {student.medicalNotes && (
                <DetailSection title="Medical Notes">
                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-sm text-rose-800 leading-relaxed shadow-sm">
                    {student.medicalNotes}
                  </div>
                </DetailSection>
              )}
            </div>
          )}

          {activeTab === "parents" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <LinkParentForm
                studentId={student.id}
                studentName={user.name}
                onLinked={() => fetchDetails(student.id)}
              />
              {student.parents?.map((sp: any, idx: number) => {
                const parent = sp.parent;
                const pUser = parent?.user || {};
                return (
                  <div
                    key={idx}
                    className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-white grid place-items-center text-[#6d3eeb] shadow-sm border border-slate-100">
                          <Phone size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{pUser.name}</h3>
                          <p className="text-sm font-bold text-[#6d3eeb] bg-purple-50 px-2 py-0.5 rounded-lg inline-block mt-1 uppercase tracking-wide text-[10px]">
                            {sp.relationship || "Guardian"}
                          </p>
                        </div>
                      </div>
                      {sp.isEmergencyContact && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 uppercase tracking-tighter">
                          Emergency Contact
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setParentToRemove({ id: sp.parentId, name: pUser.name })}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Remove link
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6 text-sm">
                      <div>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wide mb-1">
                          Phone
                        </p>
                        <p className="text-slate-900 font-bold">{parent.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wide mb-1">
                          Email
                        </p>
                        <p className="text-slate-900 font-bold">{pUser.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wide mb-1">
                          National ID
                        </p>
                        <p className="text-slate-900 font-bold">{parent.nationalId || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wide mb-1">
                          Occupation
                        </p>
                        <p className="text-slate-900 font-bold">{parent.occupation || "N/A"}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wide mb-1">
                          Location
                        </p>
                        <p className="text-slate-900 font-bold">
                          {[
                            parent.village,
                            parent.cell,
                            parent.sector,
                            parent.district,
                            parent.province,
                          ]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!student.parents || student.parents.length === 0) && (
                <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 font-bold">No parents or guardians linked.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        open={parentToRemove !== null}
        title="Remove this parent's access?"
        message={
          parentToRemove
            ? `${parentToRemove.name} will no longer see this learner's marks and attendance.`
            : undefined
        }
        confirmLabel="Remove link"
        danger
        onCancel={() => setParentToRemove(null)}
        onConfirm={async () => {
          if (!parentToRemove) return;
          const parentId = parentToRemove.id;
          setParentToRemove(null);
          try {
            await studentManagementApi.unlinkParent(student.id, parentId);
            await fetchDetails(student.id);
          } catch (err) {
            dispatch(pushToast({ tone: "error", message: (err as Error).message }));
          }
        }}
      />
    </AppDrawer>
  );
}
