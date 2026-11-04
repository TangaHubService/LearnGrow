import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { teacherApi } from "@/services/teacherApi";
import { attendanceApi, type AttendanceSummary } from "@/services/attendanceApi";
import { useAppDispatch } from "@/store/appStore";
import { pushToast } from "@/store/uiSlice";
import { getStartOfWeek, getDaysInPeriod } from "@/utils/dateUtils";

export type ViewMode = "daily" | "weekly" | "monthly" | "yearly";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface Student {
  id: string;
  studentCode: string;
  gender: string;
  user: {
    name: string;
  };
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  reason?: string;
}

export interface Class {
  id: string;
  name: string;
}

function todayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function toLocalYYYYMMDD(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useAttendance() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  // State
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | undefined>();
  const [viewBy, setViewBy] = useState<ViewMode>("daily");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(todayStart);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalFilteredStudents, setTotalFilteredStudents] = useState(0);
  const [showOnlyAtRisk] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string | undefined>();
  const [selectedTermId, setSelectedTermId] = useState<string | undefined>();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentHistory, setStudentHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Computed date range for current period
  const dateRange = useMemo(() => {
    const start = new Date(currentWeekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(currentWeekStart);
    if (viewBy === "daily") {
      end.setHours(23, 59, 59, 999);
    } else if (viewBy === "weekly") {
      end.setDate(end.getDate() + 4); // Friday
      end.setHours(23, 59, 59, 999);
    } else if (viewBy === "monthly") {
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  }, [currentWeekStart, viewBy]);

  const weekDays = useMemo(() => {
    const daysToFetch =
      viewBy === "daily" ? 1 : viewBy === "weekly" ? 5 : viewBy === "monthly" ? 30 : 365;
    const days = getDaysInPeriod(currentWeekStart, daysToFetch);
    if (viewBy === "daily") {
      const today = new Date(currentWeekStart);
      today.setHours(0, 0, 0, 0);
      return [today];
    }
    return days;
  }, [currentWeekStart, viewBy]);

  const fetchData = useCallback(async () => {
    if (!selectedClassId || !(user as any)?.schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const monthStart = new Date(currentWeekStart);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const [gridData, summaryData, monthlyGridData] = await Promise.all([
        attendanceApi.getGrid({
          schoolId: (user as any).schoolId,
          classId: selectedClassId,
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
          search: debouncedSearchQuery || undefined,
          page: currentPage,
          limit: itemsPerPage,
          status: selectedStatus || undefined,
        }),
        attendanceApi.getSummary({
          schoolId: (user as any).schoolId,
          classId: selectedClassId,
          date: currentWeekStart.toISOString(),
          period: viewBy,
        }),
        attendanceApi.getGrid({
          schoolId: (user as any).schoolId,
          classId: selectedClassId,
          startDate: monthStart.toISOString(),
          endDate: monthEnd.toISOString(),
        }),
      ]);

      setStudents(gridData.data.students);
      setRecords(gridData.data.records);
      setMonthlyRecords(monthlyGridData.data.records);
      setSummary(summaryData.data);
      setTotalFilteredStudents(gridData.data.totalCount ?? gridData.data.students.length);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch attendance data");
      dispatch(pushToast({ message: "Failed to fetch attendance data", tone: "error" }));
    } finally {
      setLoading(false);
    }
  }, [
    selectedClassId,
    user,
    currentWeekStart,
    dateRange,
    debouncedSearchQuery,
    currentPage,
    itemsPerPage,
    selectedStatus,
    dispatch,
  ]);

  const fetchStudentHistory = useCallback(async (studentId: string) => {
    setLoadingHistory(true);
    try {
      const res = await attendanceApi.getStudentHistory(studentId);
      setStudentHistory(res.data?.records ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!selectedClassId || !(user as any)?.schoolId) {
      setAiSuggestions([]);
      return;
    }
    setLoadingAi(true);
    try {
      const suggestions = await attendanceApi.getSmartSuggestions(
        selectedClassId,
        (user as any).schoolId,
      );
      setAiSuggestions(suggestions.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  }, [selectedClassId, user]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentHistory(selectedStudent.id);
    }
  }, [selectedStudent, fetchStudentHistory]);

  useEffect(() => {
    const schoolId = (user as any)?.schoolId;
    if (schoolId) {
      attendanceApi.getAcademicPeriods(schoolId).then((res) => {
        if (res.data?.length > 0) {
          setSelectedAcademicYearId(res.data[0].id);
          if (res.data[0].terms?.length > 0) {
            setSelectedTermId(res.data[0].terms[0].id);
          }
        }
      });
    }

    teacherApi
      .classes()
      .then((classRes) => {
        const nextClasses = classRes.items || [];
        setClasses(nextClasses);
        if (nextClasses.length > 0) setSelectedClassId((prev) => prev || nextClasses[0].id);
      })
      .catch((err) => {
        console.error(err);
        dispatch(pushToast({ message: "Failed to load attendance filters", tone: "error" }));
      });
  }, [user, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClassId, selectedStatus, searchQuery, currentWeekStart, viewBy]);

  const handleViewChange = (v: ViewMode) => {
    const today = new Date();
    if (v === "daily") {
      today.setHours(0, 0, 0, 0);
      setCurrentWeekStart(new Date(today));
    } else if (v === "weekly") {
      setCurrentWeekStart(getStartOfWeek(today));
    } else if (v === "monthly") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setCurrentWeekStart(first);
    } else {
      const first = new Date(today.getFullYear(), 0, 1);
      setCurrentWeekStart(first);
    }
    setViewBy(v);
  };

  const changeDate = (direction: number) => {
    const next = new Date(currentWeekStart);
    if (viewBy === "daily") next.setDate(next.getDate() + direction);
    else if (viewBy === "weekly") next.setDate(next.getDate() + direction * 7);
    else if (viewBy === "monthly") next.setMonth(next.getMonth() + direction);
    else if (viewBy === "yearly") next.setFullYear(next.getFullYear() + direction);
    setCurrentWeekStart(next);
  };

  const handleResetFilters = useCallback(() => {
    setSelectedClassId(classes[0]?.id);
    setSelectedStatus(undefined);
    setSearchQuery("");
    setViewBy("daily");
    setCurrentWeekStart(todayStart());
    setCurrentPage(1);
  }, [classes]);

  const applyLocalRecord = (
    studentId: string,
    date: Date,
    status: AttendanceStatus,
    reason?: string,
  ) => {
    setRecords((prev) => {
      const targetStr = toLocalYYYYMMDD(date);
      const filtered = prev.filter(
        (r) => !(r.studentId === studentId && toLocalYYYYMMDD(new Date(r.date)) === targetStr),
      );
      return [
        ...filtered,
        { id: Math.random().toString(), studentId, date: date.toISOString(), status, reason },
      ];
    });
  };

  const markAttendanceDirect = async (
    studentId: string,
    date: Date,
    status: AttendanceStatus,
    reason?: string,
  ) => {
    if (saving || loading) return;
    setSaving(true);
    try {
      await attendanceApi.markAttendance({
        schoolId: (user as any)?.schoolId,
        classId: selectedClassId,
        date: toLocalYYYYMMDD(date),
        records: [{ studentId, status, reason: reason || "" }],
        academicYearId: selectedAcademicYearId,
        termId: selectedTermId,
      } as any);
      applyLocalRecord(studentId, date, status, reason);
      dispatch(pushToast({ message: `Marked as ${status.toLowerCase()}`, tone: "success" }));
      await fetchData();
      setTimeout(fetchSuggestions, 2000);
    } catch (err) {
      console.error(err);
      dispatch(pushToast({ message: "Failed to update attendance", tone: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const toggleAttendance = async (studentId: string, date: Date) => {
    if (saving || loading) return;
    const targetStr = toLocalYYYYMMDD(date);
    const currentStatus = records.find(
      (r) => r.studentId === studentId && toLocalYYYYMMDD(new Date(r.date)) === targetStr,
    )?.status;
    const statuses: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
    const currentIndex = currentStatus ? statuses.indexOf(currentStatus as AttendanceStatus) : -1;
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    await markAttendanceDirect(studentId, date, nextStatus);
  };

  const markAllPresent = async () => {
    if (markingAll || loading || !selectedClassId || viewBy !== "daily" || students.length === 0)
      return;
    const date = new Date(currentWeekStart);
    date.setHours(0, 0, 0, 0);
    setMarkingAll(true);
    try {
      await attendanceApi.markAttendance({
        schoolId: (user as any)?.schoolId,
        classId: selectedClassId,
        date: toLocalYYYYMMDD(date),
        records: students.map((s) => ({
          studentId: s.id,
          status: "PRESENT" as AttendanceStatus,
          reason: "",
        })),
        academicYearId: selectedAcademicYearId,
        termId: selectedTermId,
      } as any);
      students.forEach((s) => applyLocalRecord(s.id, date, "PRESENT"));
      dispatch(
        pushToast({ message: `All ${students.length} students marked PRESENT`, tone: "success" }),
      );
      await fetchData();
    } catch (err) {
      console.error(err);
      dispatch(pushToast({ message: "Failed to mark all present", tone: "error" }));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (!selectedClassId || !(user as any)?.schoolId) return;
    attendanceApi.exportData({
      schoolId: (user as any).schoolId,
      classId: selectedClassId,
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      format: format,
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalFilteredStudents / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return {
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
    records,
    allStudents: students,
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
  };
}
