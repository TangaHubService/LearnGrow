import { useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import { CustomDropdown } from "./CustomDropdown";

export interface PaginationProps {
  page: number; // Current page (1-indexed)
  totalPages: number; // Total number of pages
  total: number; // Total number of items
  limit: number; // Number of items per page
  onChange: (page: number) => void; // Callback on page selection
  onLimitChange?: (limit: number) => void; // Optional callback for pageSize. Renders limit selector.
  itemLabel?: string; // Label for items (e.g. "learners", "courses")
  isLoading?: boolean; // Loading state
  disabled?: boolean; // General disabled state
  pageSizeOptions?: number[]; // Custom choices for page sizes
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onChange,
  onLimitChange,
  itemLabel = "items",
  isLoading = false,
  disabled = false,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const isInteractionDisabled = disabled || isLoading;

  const dropdownOptions = useMemo(() => {
    return pageSizeOptions.map((opt) => ({
      value: opt.toString(),
      label: opt.toString(),
    }));
  }, [pageSizeOptions]);

  // Generate responsive start and end counts for display text
  const startRange = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRange = Math.min(page * limit, total);

  // Generate range of page numbers to show with elegant truncation
  const pageNumbers: (number | string)[] = [];
  if (totalPages > 1) {
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (page <= 4) {
        pageNumbers.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (page >= totalPages - 3) {
        pageNumbers.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pageNumbers.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 py-5 sm:flex-row w-full">
      {/* Left: Stats & Information (Showing X to Y of Z) */}
      <div className="flex items-center gap-3 text-center sm:text-left">
        <p className="text-xs font-semibold text-slate-500">
          Showing <span className="font-bold text-slate-800">{startRange}</span> to{" "}
          <span className="font-bold text-slate-800">{endRange}</span> of{" "}
          <span className="font-bold text-slate-800">{total}</span> {itemLabel}
        </p>
        {isLoading && <Loader2 className="h-4.5 w-4.5 animate-spin text-purple-600" />}
      </div>

      {/* Middle/Right: Combined page size selection and pagination buttons */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 w-full sm:w-auto">
        {/* Optional Page Size Selector */}
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide select-none">
              Show
            </span>
            <div className="w-20">
              <CustomDropdown
                disabled={isInteractionDisabled}
                value={limit?.toString()}
                onChange={(val) => val && onLimitChange(parseInt(val, 10))}
                options={dropdownOptions}
                clearable={false}
                position="top"
                className="!min-h-10 !h-10 !px-3 !py-1 text-xs font-bold text-slate-700 !rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide select-none">
              per page
            </span>
          </div>
        )}

        {/* Navigation Button Controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            {/* First Page Button */}
            <button
              type="button"
              disabled={page <= 1 || isInteractionDisabled}
              onClick={() => onChange(1)}
              title="First Page"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous Page Button */}
            <button
              type="button"
              disabled={page <= 1 || isInteractionDisabled}
              onClick={() => onChange(page - 1)}
              title="Previous Page"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Mobile-friendly page indicator */}
            <span className="text-xs font-bold text-slate-600 px-3 select-none sm:hidden">
              Page {page} of {totalPages}
            </span>

            {/* Large screen numbered buttons */}
            <div className="hidden sm:flex items-center gap-1.5">
              {pageNumbers.map((p, idx) => {
                if (p === "...") {
                  return (
                    <span
                      key={`dots-${idx}`}
                      className="px-2 text-xs font-bold text-slate-500 select-none"
                    >
                      ...
                    </span>
                  );
                }

                const isCurrent = p === page;
                return (
                  <button
                    key={`page-${p}`}
                    type="button"
                    disabled={isInteractionDisabled}
                    onClick={() => onChange(Number(p))}
                    className={`h-10 min-w-[40px] rounded-xl px-3 text-xs font-bold transition-all duration-200 border shadow-sm ${
                      isCurrent
                        ? "bg-[#6d3eeb] border-[#6d3eeb] text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-200"
                        : "bg-white border-slate-200 text-slate-600 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-100"
                    } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm active:translate-y-0`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Next Page Button */}
            <button
              type="button"
              disabled={page >= totalPages || isInteractionDisabled}
              onClick={() => onChange(page + 1)}
              title="Next Page"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page Button */}
            <button
              type="button"
              disabled={page >= totalPages || isInteractionDisabled}
              onClick={() => onChange(totalPages)}
              title="Last Page"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
