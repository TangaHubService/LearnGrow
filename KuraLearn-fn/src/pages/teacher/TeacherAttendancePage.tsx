import React, { useState } from "react";
import { Search } from "lucide-react";
import { AppDrawer, DetailRow, InfoGrid } from "../../components/ModernUi";
import { useAttendance } from "@/hooks/useAttendance";
import { AttendanceStatsCards } from "./attendance/AttendanceStatsCards";
import { AttendanceFilters } from "./attendance/AttendanceFilters";
import { AttendanceGrid } from "./attendance/AttendanceGrid";
import { AiInsights } from "./attendance/AiInsights";
import { formatDateRange } from "@/utils/dateUtils";

const TeacherAttendancePage: React.FC = () => {
  const {
    classes,
    selectedClassId,
    setSelectedClassId,
    selectedStatus,
    setSelectedStatus,
    viewBy,
    currentWeekStart,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    saving,
    markingAll,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalFilteredStudents,
    totalPages,
    students,
    allStudents,
    records,
    monthlyRecords,
    summary,
    aiSuggestions,
    loadingAi,
    selectedStudent,
    setSelectedStudent,
    studentHistory,
    loadingHistory,
    dateRange,
    weekDays,
    handleViewChange,
    changeDate,
    handleResetFilters,
    toggleAttendance,
    markAttendanceDirect,
    markAllPresent,
    handleExport,
    fetchSuggestions,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<"overview" | "ai-insights">("overview");
  const selectedClassName = classes.find((item) => item.id === selectedClassId)?.name;

  const getDisplayDate = () => {
    if (viewBy === "daily") {
      return currentWeekStart.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (viewBy === "monthly") {
      return currentWeekStart.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    }
    if (viewBy === "yearly") {
      return currentWeekStart.getFullYear().toString();
    }
    const end = new Date(currentWeekStart);
    if (viewBy === "weekly") end.setDate(end.getDate() + 4);
    return formatDateRange(currentWeekStart, end);
  };

  return (
    <div className="mx-auto min-h-screen max-w-[1500px] space-y-5 bg-slate-50/30 p-3 sm:p-5 md:p-8">
      <div className="flex flex-col gap-1 print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
          Attendance
        </h1>
        <div className="text-sm font-semibold text-slate-500">
          {selectedClassName ?? "Class attendance"}
        </div>
      </div>

      <AttendanceFilters
        selectedClassId={selectedClassId}
        classes={classes}
        selectedStatus={selectedStatus}
        viewBy={viewBy}
        getDisplayDate={getDisplayDate}
        onClassChange={setSelectedClassId}
        onStatusChange={setSelectedStatus}
        onViewChange={handleViewChange}
        onChangeDate={changeDate}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
      />

      <AttendanceStatsCards
        summary={summary}
        loading={loading}
        error={error}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
      />

      <div className="flex gap-2 border-b border-slate-200 print:hidden">
        {[
          { id: "overview", label: "Attendance List" },
          { id: "ai-insights", label: "AI Insights" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "overview" | "ai-insights")}
            type="button"
            className={`border-b-2 px-2 pb-3 text-sm font-bold transition ${
              activeTab === tab.id
                ? "border-[#6d3eeb] text-[#6d3eeb]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "ai-insights" ? (
        <AiInsights
          loading={loadingAi}
          suggestions={aiSuggestions}
          summary={summary}
          students={allStudents}
          records={records}
          monthlyRecords={monthlyRecords}
          viewBy={viewBy}
          currentDate={currentWeekStart}
          selectedClassName={selectedClassName}
          onSelectStudent={setSelectedStudent}
          onRefresh={fetchSuggestions}
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm print:hidden">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search name, code, or gender"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>
          </div>

          <AttendanceGrid
            viewBy={viewBy}
            loading={loading}
            saving={saving}
            markingAll={markingAll}
            students={students}
            records={records}
            weekDays={weekDays}
            currentWeekStart={currentWeekStart}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalRecords={totalFilteredStudents}
            totalPages={totalPages}
            dateRange={dateRange}
            onToggleAttendance={toggleAttendance}
            onMarkDirect={markAttendanceDirect}
            onMarkAllPresent={markAllPresent}
            onSelectStudent={setSelectedStudent}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      <AppDrawer
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.user.name}
      >
        <div className="space-y-6">
          <InfoGrid>
            <DetailRow label="Student Code" value={selectedStudent?.studentCode} />
            <DetailRow label="Gender" value={selectedStudent?.gender} />
          </InfoGrid>
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Attendance History</h3>
            {loadingHistory ? (
              <p className="text-xs font-bold text-slate-500">Loading history...</p>
            ) : (
              <div className="space-y-2">
                {studentHistory?.map((h: any) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                  >
                    <span className="text-xs font-bold text-slate-700">
                      {new Date(h.date).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        h.status === "PRESENT"
                          ? "bg-emerald-100 text-emerald-700"
                          : h.status === "ABSENT"
                            ? "bg-rose-100 text-rose-700"
                            : h.status === "LATE"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppDrawer>
    </div>
  );
};

export default TeacherAttendancePage;
