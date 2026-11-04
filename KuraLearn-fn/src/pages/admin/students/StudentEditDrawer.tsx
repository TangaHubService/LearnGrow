import { useState, useEffect } from "react";
import { AppDrawer, CustomDropdown } from "@/components/ModernUi";
import { Save, User, Mail, GraduationCap, School, MapPin, AlertCircle } from "lucide-react";
import { studentManagementApi } from "@/services/studentManagementService";
import { useTeacherReferenceData } from "@/pages/teacher/teacherReference";
import { useDispatch } from "react-redux";
import { pushToast } from "@/store/uiSlice";

export function StudentEditDrawer({
  studentId,
  open,
  onClose,
  onSuccess,
}: {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const dispatch = useDispatch();
  const { data: refData } = useTeacherReferenceData();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    classId: "",
    status: "ACTIVE",
    gender: "",
    stream: "",
    boardingStatus: "",
    hasDisability: false,
    disabilityType: "",
    specialSupportNeeds: "",
  });

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await studentManagementApi.getDetails(studentId!);
      if (res.success && res.data) {
        const s = res.data;
        setFormData({
          name: s.user?.name || "",
          email: s.user?.email || "",
          classId: s.classId || "",
          status: s.status || "ACTIVE",
          gender: s.gender || "",
          stream: s.stream || "",
          boardingStatus: s.boardingStatus || "",
          hasDisability: s.hasDisability || false,
          disabilityType: s.disabilityType || "",
          specialSupportNeeds: s.specialSupportNeeds || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && studentId) {
      fetchStudent();
    }
  }, [open, studentId]);

  const handleSave = async () => {
    if (!studentId) return;
    setSaving(true);
    try {
      const res = await studentManagementApi.update(studentId, formData);
      if (res.success) {
        dispatch(pushToast({ tone: "success", message: "Student updated successfully" }));
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      dispatch(pushToast({ tone: "error", message: err.message || "Failed to update student" }));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const classOptions = (refData?.classes || []).map((c: any) => ({
    value: c.id,
    label: c.name,
    description: c.level?.name,
  }));

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "ARCHIVED", label: "Archived" },
    { value: "TRANSFERRED", label: "Transferred" },
    { value: "GRADUATED", label: "Graduated" },
    { value: "DROPPED_OUT", label: "Dropped Out" },
  ];

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Edit Student Profile"
      subtitle="Modify student administrative details"
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[#6d3eeb] text-white text-sm font-bold rounded-lg hover:bg-[#5b31cb] transition-all shadow-md disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save size={18} />
            )}
            Save Changes
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6d3eeb] border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <User size={16} /> Personal Info
              </h3>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-50 outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-50 outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Gender</label>
                  <CustomDropdown
                    value={formData.gender}
                    options={[
                      { value: "MALE", label: "Male" },
                      { value: "FEMALE", label: "Female" },
                    ]}
                    onChange={(val) => setFormData({ ...formData, gender: val || "" })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Status</label>
                  <CustomDropdown
                    value={formData.status}
                    options={statusOptions}
                    onChange={(val) => setFormData({ ...formData, status: val || "ACTIVE" })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <School size={16} /> Academic Placement
              </h3>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Assigned Class
                </label>
                <CustomDropdown
                  value={formData.classId}
                  options={classOptions}
                  onChange={(val) => setFormData({ ...formData, classId: val || "" })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Stream</label>
                  <input
                    type="text"
                    value={formData.stream}
                    onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-50 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Boarding</label>
                  <CustomDropdown
                    value={formData.boardingStatus}
                    options={[
                      { value: "DAY", label: "Day Scholar" },
                      { value: "BOARDING", label: "Boarding" },
                    ]}
                    onChange={(val) => setFormData({ ...formData, boardingStatus: val || "" })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <AlertCircle size={16} /> Inclusive Education
                </h3>

                <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <input
                    type="checkbox"
                    id="hasDisability"
                    checked={formData.hasDisability}
                    onChange={(e) => setFormData({ ...formData, hasDisability: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-[#6d3eeb] focus:ring-[#6d3eeb]"
                  />
                  <label
                    htmlFor="hasDisability"
                    className="text-sm font-bold text-amber-900 cursor-pointer"
                  >
                    Student has a disability or special needs
                  </label>
                </div>

                {formData.hasDisability && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Disability Type
                      </label>
                      <input
                        type="text"
                        value={formData.disabilityType}
                        onChange={(e) =>
                          setFormData({ ...formData, disabilityType: e.target.value })
                        }
                        placeholder="e.g. Visual Impairment"
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-50 outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Special Support Needs
                      </label>
                      <textarea
                        value={formData.specialSupportNeeds}
                        onChange={(e) =>
                          setFormData({ ...formData, specialSupportNeeds: e.target.value })
                        }
                        placeholder="Describe required support..."
                        className="w-full min-h-[80px] p-4 rounded-xl border border-slate-200 focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-50 outline-none transition-all font-medium resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppDrawer>
  );
}
