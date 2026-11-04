import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { pushToast } from "@/store/uiSlice";
import { studentManagementApi } from "@/services/studentManagementService";
import { useDebounce } from "./useDebounce";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function useStudentList() {
  const dispatch = useDispatch();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [filters, setFilters] = useState({
    classId: "",
    gender: "",
    status: "",
    disabilityStatus: "",
    academicYear: "",
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentManagementApi.list({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        ...filters,
      });
      if (res.success) {
        setStudents(res.data || []);
        if (res.pagination) setPagination(res.pagination);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error(err);
      dispatch(pushToast({ tone: "error", message: "Failed to fetch students" }));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, filters, dispatch]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const res = await studentManagementApi.list({
        page: 1,
        limit: 1000,
        search: debouncedSearch,
        ...filters,
      });
      if (!res.success || !res.data.length) return;

      const ws = XLSX.utils.json_to_sheet(
        res.data.map((s: any) => ({
          Code: s.studentCode,
          Name: s.user?.name,
          Class: s.class?.name,
          Gender: s.gender,
          Status: s.status,
        })),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students");
      XLSX.writeFile(wb, "Students_Export.xlsx");
      dispatch(pushToast({ tone: "success", message: "Exported to Excel" }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const res = await studentManagementApi.list({
        page: 1,
        limit: 1000,
        search: debouncedSearch,
        ...filters,
      });
      if (!res.success || !res.data.length) return;

      const doc = new jsPDF();
      autoTable(doc, {
        head: [["Code", "Name", "Class", "Gender", "Status"]],
        body: res.data.map((s: any) => [
          s.studentCode,
          s.user?.name,
          s.class?.name || "N/A",
          s.gender,
          s.status,
        ]),
      });
      doc.save("Students_Report.pdf");
      dispatch(pushToast({ tone: "success", message: "Exported to PDF" }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const archiveStudent = async (id: string) => {
    const res = await studentManagementApi.archive(id);
    if (res.success) {
      fetchStudents();
      dispatch(pushToast({ tone: "success", message: "Student archived" }));
    }
    return res;
  };

  const deleteStudent = async (id: string) => {
    const res = await studentManagementApi.delete(id);
    if (res.success) {
      fetchStudents();
      dispatch(pushToast({ tone: "success", message: "Student deleted" }));
    }
    return res;
  };

  return {
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
  };
}
