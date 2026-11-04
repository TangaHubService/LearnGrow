import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "../../teacherShared";

interface ExportButtonsProps {
  filters: {
    search?: string;
    classId?: string;
    stream?: string;
    gender?: string;
    status?: string;
    disability?: string;
    academicYear?: string;
  };
}

export function ExportButtons({ filters }: ExportButtonsProps) {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExport = async (format: "excel" | "pdf") => {
    if (format === "excel") setExportingCsv(true);
    else setExportingPdf(true);

    try {
      const token = localStorage.getItem("kuralearn_token");
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          queryParams.set(key, String(value));
        }
      });

      const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
      const url = `${baseUrl}/teacher/students/export/${format}?${queryParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) throw new Error("Failed to export learners");

      if (format === "pdf") {
        const htmlText = await response.text();
        const blob = new Blob([htmlText], { type: "text/html" });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } else {
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `learners_export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      if (format === "excel") setExportingCsv(false);
      else setExportingPdf(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        onClick={() => handleExport("excel")}
        disabled={exportingCsv}
        className="h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm text-xs font-bold gap-1.5"
      >
        <Download size={14} className={exportingCsv ? "animate-bounce" : ""} />
        {exportingCsv ? "Exporting..." : "Export Excel"}
      </Button>
      <Button
        variant="secondary"
        onClick={() => handleExport("pdf")}
        disabled={exportingPdf}
        className="h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm text-xs font-bold gap-1.5"
      >
        <FileText size={14} className={exportingPdf ? "animate-pulse" : ""} />
        {exportingPdf ? "Exporting..." : "Export PDF"}
      </Button>
    </div>
  );
}
