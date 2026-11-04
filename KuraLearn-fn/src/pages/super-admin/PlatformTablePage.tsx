import { type ReactNode, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DashboardPageLayout, DashboardPanel } from "@/components/dashboard/DashboardLayout";
import { ModernTable, type TableColumn } from "@/components/common/ModernTable";
import { Pagination } from "@/components/common/Pagination";
import { SearchInput } from "@/components/common/SearchInput";
import { InlineErrorState } from "@/pages/teacher/teacherShared";
import type { PageParams, Paged } from "@/services/superAdminApi";
import { readable } from "./format";

export type TableFilter = { key: string; label: string; options: string[] };

/** The search, filters, table and paging shared by the Super Admin list pages. */
export function PlatformTablePage<T>({
  title,
  subtitle,
  panelTitle,
  queryKey,
  fetchPage,
  columns,
  filters = [],
  searchPlaceholder,
  itemLabel,
  emptyMessage,
  action,
}: {
  title: string;
  subtitle: string;
  panelTitle: string;
  queryKey: string;
  fetchPage: (
    params: PageParams & Record<string, string | number | undefined>,
  ) => Promise<Paged<T>>;
  columns: TableColumn<T>[];
  filters?: TableFilter[];
  searchPlaceholder: string;
  itemLabel: string;
  emptyMessage: string;
  action?: ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const result = useQuery({
    queryKey: ["super-admin", queryKey, page, pageSize, search, filterValues],
    queryFn: () => fetchPage({ page, pageSize, search, ...filterValues }),
    placeholderData: keepPreviousData,
  });

  return (
    <DashboardPageLayout title={title} subtitle={subtitle} action={action}>
      <DashboardPanel title={panelTitle} bodyClassName="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full sm:w-72"
          />
          {filters.map((filter) => (
            <label key={filter.key} className="text-xs font-semibold text-slate-500">
              <span className="sr-only">{filter.label}</span>
              <select
                value={filterValues[filter.key] ?? ""}
                onChange={(event) => {
                  setFilterValues((current) => ({ ...current, [filter.key]: event.target.value }));
                  setPage(1);
                }}
                className="custom-select h-10 rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-700"
              >
                <option value="">All {filter.label.toLowerCase()}</option>
                {filter.options.map((option) => (
                  <option key={option} value={option}>
                    {readable(option)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        {result.error ? (
          <InlineErrorState
            message={(result.error as Error).message}
            onRetry={() => result.refetch()}
          />
        ) : (
          <div className={result.isPlaceholderData ? "opacity-60" : undefined}>
            <ModernTable
              data={result.data?.items}
              columns={columns}
              loading={result.isLoading}
              emptyMessage={emptyMessage}
            />
            {result.data && result.data.total > 0 ? (
              <div className="mt-4">
                <Pagination
                  page={result.data.page}
                  totalPages={result.data.totalPages}
                  total={result.data.total}
                  limit={result.data.pageSize}
                  onChange={setPage}
                  onLimitChange={(limit) => {
                    setPageSize(limit);
                    setPage(1);
                  }}
                  itemLabel={itemLabel}
                  isLoading={result.isFetching}
                />
              </div>
            ) : null}
          </div>
        )}
      </DashboardPanel>
    </DashboardPageLayout>
  );
}
