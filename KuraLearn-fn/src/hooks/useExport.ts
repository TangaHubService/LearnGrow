import { useState } from "react";
import { apiRequest } from "../lib/api";

type ExportFormat = "csv" | "excel" | "pdf";

interface ExportOptions {
  endpoint: string;
  filename?: string;
  format: ExportFormat;
  filters?: Record<string, string>;
}

const mimeTypes: Record<ExportFormat, string> = {
  csv: "text/csv",
  excel: "application/vnd.ms-excel",
  pdf: "application/pdf",
};

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  async function doExport({ endpoint, filename, format, filters }: ExportOptions) {
    setIsExporting(true);
    try {
      const params = new URLSearchParams(filters);
      const url = `${endpoint}/${format}?${params}`;
      const token = localStorage.getItem("kuralearn_token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1"}${url}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename ?? `export-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setIsExporting(false);
    }
  }

  return { isExporting, export: doExport };
}
