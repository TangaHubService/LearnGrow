import { useState } from "react";
import {
  Plus,
  UserPlus,
  Search,
  Users,
  User,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Edit,
  Archive,
} from "lucide-react";
import { StatusBadge, CustomDropdown, ConfirmModal } from "@/components/ModernUi";
import { Pagination } from "@/components/common/Pagination";
import { Link } from "react-router-dom";
import { StudentDetailsDrawer } from "./StudentDetailsDrawer";
import { LinkLearnerDrawer } from "./LinkLearnerDrawer";
import { StudentEditDrawer } from "./StudentEditDrawer";
import { useTeacherReferenceData } from "@/pages/teacher/teacherReference";
import { useStudentList } from "@/hooks/useStudentList";

export function StudentListPage() {
  const {
    students,
    loading,
    stats,
    pagination,
    setPagination,
    search,
    setSearch,
    filters,
    setFilters,
    fetchStudents,
    handleExportExcel,
    handleExportPDF,
    archiveStudent,
    deleteStudent,
  } = useStudentList();

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
    danger?: boolean;
  }>({ open: false, title: "", message: "", action: () => {} });

  const { data: refData } = useTeacherReferenceData();

  const handleArchive = (id: string) => {
    setConfirmState({
      open: true,
      title: "Archive Student",
      message: "Archive this student?",
      danger: true,
      action: () => archiveStudent(id),
    });
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      open: true,
      title: "Delete Student",
      message: "Permanently delete this record?",
      danger: true,
      action: () => deleteStudent(id),
    });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-sm font-medium text-slate-500">
            Manage all student records and enrollments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileSpreadsheet size={16} className="text-emerald-700" /> Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileText size={16} className="text-rose-700" /> Export PDF
          </button>
          <button
            onClick={() => setLinkOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <UserPlus size={16} /> Add Learner Who Signed Up
          </button>
          <Link
            to="/admin/students/register"
            className="flex items-center gap-2 px-4 py-2 bg-[#6d3eeb] text-white rounded-lg text-sm font-bold hover:bg-[#5b31cb] transition-all shadow-md"
          >
            <Plus size={18} /> Add New Student
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            value: stats?.totalStudents,
            icon: <Users size={18} />,
            color: "text-blue-600",
            bg: "bg-blue-50",
            active: !filters.gender && !filters.disabilityStatus,
            onClick: () => setFilters((p) => ({ ...p, gender: "", disabilityStatus: "" })),
          },
          {
            label: "Male",
            value: stats?.maleStudents,
            icon: <User size={18} />,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            active: filters.gender === "MALE",
            onClick: () => setFilters((p) => ({ ...p, gender: "MALE", disabilityStatus: "" })),
          },
          {
            label: "Female",
            value: stats?.femaleStudents,
            icon: <User size={18} />,
            color: "text-rose-700",
            bg: "bg-rose-50",
            active: filters.gender === "FEMALE",
            onClick: () => setFilters((p) => ({ ...p, gender: "FEMALE", disabilityStatus: "" })),
          },
          {
            label: "Disability",
            value: stats?.studentsWithDisability,
            subValue: `${stats?.maleWithDisability || 0} | ${stats?.femaleWithDisability || 0}`,
            icon: <AlertCircle size={18} />,
            color: "text-amber-700",
            bg: "bg-amber-50",
            active: filters.disabilityStatus === "Yes",
            onClick: () => setFilters((p) => ({ ...p, disabilityStatus: "Yes", gender: "" })),
          },
        ].map((s, i) => (
          <button
            key={i}
            onClick={s.onClick}
            className={`p-4 rounded-xl border transition-all text-left flex items-center gap-4 ${
              s.active
                ? "bg-white border-[#6d3eeb] ring-2 ring-purple-100 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
            }`}
          >
            <div className={`p-2.5 rounded-lg ${s.bg} ${s.color}`}>{s.icon}</div>
            <div>
              <p
                className={`text-[10px] font-bold uppercase tracking-wide ${s.active ? "text-[#6d3eeb]" : "text-slate-500"}`}
              >
                {s.label}
              </p>
              <p className="text-xl font-bold text-slate-900">{s.value || 0}</p>
              {s.subValue && (
                <p className="text-[10px] font-bold text-slate-500">
                  ♂ {s.subValue.split("|")[0]} | ♀ {s.subValue.split("|")[1]}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-center">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium transition-all focus:border-[#6d3eeb] focus:outline-none"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(180px,220px)_minmax(180px,220px)_auto] lg:flex lg:items-center lg:justify-end">
          <div className="min-w-0 lg:w-52">
            <CustomDropdown
              value={filters.classId}
              onChange={(val) => setFilters((p) => ({ ...p, classId: val || "" }))}
              placeholder="All Classes"
              clearable={false}
              className="!min-h-11 rounded-lg bg-slate-50"
              options={[
                { value: "", label: "All Classes" },
                ...(refData?.classes || []).map((c: any) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <div className="min-w-0 lg:w-52">
            <CustomDropdown
              value={filters.status}
              onChange={(val) => setFilters((p) => ({ ...p, status: val || "" }))}
              placeholder="All Statuses"
              clearable={false}
              className="!min-h-11 rounded-lg bg-slate-50"
              options={[
                { value: "", label: "All Statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "ARCHIVED", label: "Archived" },
                { value: "TRANSFERRED", label: "Transferred" },
              ]}
            />
          </div>
          <button
            onClick={() =>
              setFilters({
                classId: "",
                gender: "",
                status: "",
                disabilityStatus: "",
                academicYear: "",
              })
            }
            className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div tabIndex={0} className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-4 py-4 font-bold text-[10px] uppercase tracking-wide text-slate-500">
                  Code
                </th>
                <th className="px-4 py-4 font-bold text-[10px] uppercase tracking-wide text-slate-500">
                  Full Name
                </th>
                <th className="px-4 py-4 font-bold text-[10px] uppercase tracking-wide text-slate-500">
                  Class
                </th>
                <th className="px-4 py-4 font-bold text-[10px] uppercase tracking-wide text-slate-500">
                  Gender
                </th>
                <th className="px-4 py-4 font-bold text-[10px] uppercase tracking-wide text-slate-500">
                  Disability
                </th>
                <th className="px-4 py-4 font-bold text-[10px] uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-4 text-right font-bold text-[10px] uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-6 py-5">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                : students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 font-mono font-bold text-[#6d3eeb]">
                        <button onClick={() => setSelectedStudent(s)} className="hover:underline">
                          {s.studentCode || "N/A"}
                        </button>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900">{s.user?.name}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                          {s.class?.name || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.gender === "MALE" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}
                        >
                          {s.gender === "MALE" ? "♂" : "♀"} {s.gender}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {s.hasDisability ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-100 text-xs font-bold text-purple-700">
                            {s.disabilityType || "Yes"}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          value={s.status}
                          tone={
                            s.status === "ACTIVE"
                              ? "success"
                              : s.status === "ARCHIVED"
                                ? "neutral"
                                : "warning"
                          }
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setSelectedStudent(s)}
                            className="p-2 text-slate-500 hover:text-[#6d3eeb] rounded-xl hover:bg-purple-50 transition-colors"
                            title="View Details"
                          >
                            <User size={16} />
                          </button>
                          <button
                            onClick={() => setEditingStudent(s)}
                            className="p-2 text-slate-500 hover:text-[#6d3eeb] rounded-xl hover:bg-purple-50 transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleArchive(s.id)}
                            className="p-2 text-slate-500 hover:text-amber-600 rounded-xl hover:bg-amber-50 transition-colors"
                            title="Archive"
                          >
                            <Archive size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 bg-slate-50/50 border-t border-slate-200 w-full">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.totalRecords}
            limit={pagination.limit}
            onChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
            onLimitChange={(lim) => setPagination((prev) => ({ ...prev, limit: lim, page: 1 }))}
            itemLabel="records"
            isLoading={loading}
          />
        </div>
      </div>

      <StudentDetailsDrawer
        student={selectedStudent}
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
      <StudentEditDrawer
        studentId={editingStudent?.id}
        open={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSuccess={() => fetchStudents()}
      />
      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        danger={confirmState.danger}
        onCancel={() => setConfirmState((p) => ({ ...p, open: false }))}
        onConfirm={() => {
          confirmState.action();
          setConfirmState((p) => ({ ...p, open: false }));
        }}
      />
      <LinkLearnerDrawer
        open={linkOpen}
        classes={refData?.classes ?? []}
        onClose={() => setLinkOpen(false)}
        onLinked={fetchStudents}
      />
    </div>
  );
}
