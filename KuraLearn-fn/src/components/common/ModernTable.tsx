import { ReactNode } from "react";

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  align?: "left" | "center" | "right";
}

export function ModernTable<T>({
  data,
  columns,
  onRowClick,
  loading,
  emptyMessage = "No data found.",
  rowIdKey = "id" as keyof T,
}: {
  data?: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  rowIdKey?: keyof T;
}) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Table, scroll to see more"
      className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <table className="w-full text-left text-sm border-collapse">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 ${col.className ?? ""} ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-4">
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                  </td>
                ))}
              </tr>
            ))
          ) : !data || data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-slate-500 font-medium"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={String(row[rowIdKey] ?? i)}
                onClick={() => onRowClick?.(row)}
                className={`group transition-colors ${onRowClick ? "cursor-pointer hover:bg-slate-50/80" : "hover:bg-slate-50/40"}`}
              >
                {columns.map((col, j) => {
                  const content =
                    typeof col.accessor === "function"
                      ? col.accessor(row)
                      : (row[col.accessor] as ReactNode);
                  return (
                    <td
                      key={j}
                      className={`px-4 py-3.5 text-slate-700 font-medium whitespace-nowrap ${col.className ?? ""} ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
