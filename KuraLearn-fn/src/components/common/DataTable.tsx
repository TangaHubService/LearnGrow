import { ReactNode, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Search } from "lucide-react";
import { Pagination } from "./Pagination";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  accessor?: keyof T | ((row: T) => ReactNode);
  sortValue?: (row: T) => string | number | null | undefined;
  cell?: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  mobileLabel?: string;
};

export type DataTablePagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export function DataTable<T>({
  data,
  columns,
  getRowId,
  loading = false,
  emptyTitle = "No records found",
  emptyMessage,
  toolbar,
  pagination,
  selectedIds,
  onSelectionChange,
  onRowClick,
  rowActions,
  mobileRender,
}: {
  data?: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  toolbar?: ReactNode;
  pagination?: DataTablePagination;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  mobileRender?: (row: T) => ReactNode;
}) {
  const [sort, setSort] = useState<{ id: string; dir: "asc" | "desc" } | null>(null);
  const items = data ?? [];
  const selected = new Set(selectedIds ?? []);
  const selectable = Boolean(onSelectionChange);

  const sortedItems = useMemo(() => {
    if (!sort) return items;
    const column = columns.find((col) => col.id === sort.id);
    if (!column) return items;

    return [...items].sort((a, b) => {
      const left = column.sortValue?.(a) ?? readCellValue(a, column);
      const right = column.sortValue?.(b) ?? readCellValue(b, column);
      const result = String(left ?? "").localeCompare(String(right ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sort.dir === "asc" ? result : -result;
    });
  }, [columns, items, sort]);

  const allVisibleIds = sortedItems.map(getRowId);
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allVisibleSelected) {
      onSelectionChange((selectedIds ?? []).filter((id) => !allVisibleIds.includes(id)));
    } else {
      onSelectionChange(Array.from(new Set([...(selectedIds ?? []), ...allVisibleIds])));
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    if (selected.has(id)) {
      onSelectionChange((selectedIds ?? []).filter((item) => item !== id));
    } else {
      onSelectionChange([...(selectedIds ?? []), id]);
    }
  };

  const renderCell = (row: T, column: DataTableColumn<T>) => {
    if (column.cell) return column.cell(row);
    if (typeof column.accessor === "function") return column.accessor(row);
    if (column.accessor) return row[column.accessor] as ReactNode;
    return null;
  };

  const sortButton = (column: DataTableColumn<T>) => {
    if (!column.sortable) return column.header;
    const active = sort?.id === column.id;
    const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <button
        type="button"
        onClick={() =>
          setSort((current) =>
            current?.id === column.id
              ? { id: column.id, dir: current.dir === "asc" ? "desc" : "asc" }
              : { id: column.id, dir: "asc" },
          )
        }
        className="inline-flex items-center gap-1.5 rounded-md text-left transition hover:text-slate-900"
      >
        <span>{column.header}</span>
        <Icon size={13} className={active ? "text-[#6d3eeb]" : "text-slate-500"} />
      </button>
    );
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {toolbar ? (
        <div className="border-b border-slate-100 bg-white px-4 py-3">{toolbar}</div>
      ) : null}

      <div
        tabIndex={0}
        role="region"
        aria-label="Table, scroll to see more"
        className="hidden overflow-x-auto lg:block"
      >
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
            <tr>
              {selectable ? (
                <th className="w-11 px-4 py-3">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className={`grid h-5 w-5 place-items-center rounded border transition ${
                      allVisibleSelected
                        ? "border-[#6d3eeb] bg-[#6d3eeb] text-white"
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                    aria-label="Select all rows"
                  >
                    <Check size={13} />
                  </button>
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-4 py-3 text-xs font-bold uppercase text-slate-500 ${alignClass(column.align)} ${column.className ?? ""}`}
                >
                  {sortButton(column)}
                </th>
              ))}
              {rowActions ? (
                <th className="w-1 px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {selectable ? (
                    <td className="px-4 py-4">
                      <div className="h-5 w-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td key={column.id} className="px-4 py-4">
                      <div className="h-4 w-full max-w-36 animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                  {rowActions ? (
                    <td className="px-4 py-4">
                      <div className="h-8 w-20 animate-pulse rounded bg-slate-100" />
                    </td>
                  ) : null}
                </tr>
              ))
            ) : sortedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-6 py-14 text-center"
                >
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-slate-50 text-slate-500">
                    <Search size={20} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-800">{emptyTitle}</p>
                  {emptyMessage ? (
                    <p className="mt-1 text-sm font-medium text-slate-500">{emptyMessage}</p>
                  ) : null}
                </td>
              </tr>
            ) : (
              sortedItems.map((row) => {
                const rowId = getRowId(row);
                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/60"}`}
                  >
                    {selectable ? (
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleOne(rowId)}
                          className={`grid h-5 w-5 place-items-center rounded border transition ${
                            selected.has(rowId)
                              ? "border-[#6d3eeb] bg-[#6d3eeb] text-white"
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                          aria-label="Select row"
                        >
                          <Check size={13} />
                        </button>
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={`px-4 py-3 align-middle text-sm font-semibold text-slate-700 ${alignClass(column.align)} ${column.className ?? ""}`}
                      >
                        {renderCell(row, column)}
                      </td>
                    ))}
                    {rowActions ? (
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {rowActions(row)}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 lg:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={`mobile-skeleton-${index}`} className="space-y-3 p-4">
              <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
            </div>
          ))
        ) : sortedItems.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-slate-50 text-slate-500">
              <Search size={20} />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">{emptyTitle}</p>
            {emptyMessage ? (
              <p className="mt-1 text-sm font-medium text-slate-500">{emptyMessage}</p>
            ) : null}
          </div>
        ) : (
          sortedItems.map((row) => {
            const rowId = getRowId(row);
            return (
              <article key={rowId} className="p-4" onClick={() => onRowClick?.(row)}>
                {mobileRender ? (
                  mobileRender(row)
                ) : (
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                    {columns.slice(0, 5).map((column) => (
                      <div key={column.id} className="flex items-start justify-between gap-4">
                        <span className="text-[11px] font-bold uppercase text-slate-500">
                          {column.mobileLabel ?? column.header}
                        </span>
                        <span className="text-right text-sm font-bold text-slate-800">
                          {renderCell(row, column)}
                        </span>
                      </div>
                    ))}
                    {rowActions ? <div className="pt-2">{rowActions(row)}</div> : null}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {pagination ? (
        <div className="px-4">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.pageSize}
            onChange={pagination.onPageChange}
            onLimitChange={pagination.onPageSizeChange}
            isLoading={loading}
          />
        </div>
      ) : null}
    </section>
  );
}

function alignClass(align?: "left" | "center" | "right") {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

function readCellValue<T>(row: T, column: DataTableColumn<T>) {
  if (typeof column.accessor === "function") return column.accessor(row);
  if (column.accessor) return row[column.accessor];
  return undefined;
}
