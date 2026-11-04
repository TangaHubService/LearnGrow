import { useExport } from "../../hooks/useExport";

interface ExportButtonProps {
  endpoint: string;
  filename?: string;
  filters?: Record<string, string>;
  label?: string;
  format?: "csv" | "excel" | "pdf";
  className?: string;
}

export function ExportButton({
  endpoint,
  filename,
  filters,
  label = "Export",
  format = "csv",
  className = "",
}: ExportButtonProps) {
  const { isExporting, export: doExport } = useExport();

  return (
    <button
      onClick={() => doExport({ endpoint, filename, format, filters })}
      disabled={isExporting}
      className={`inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 disabled:opacity-50 ${className}`}
    >
      {isExporting ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
