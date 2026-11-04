import { MessageSquare } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";

export function MarksEntryGrid({
  records,
  maxScore,
  locked,
  loading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onScoreChange,
  onCommentChange,
}: {
  records: any[];
  maxScore: number;
  locked?: boolean;
  loading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onScoreChange: (studentId: string, score: string) => void;
  onCommentChange: (studentId: string, comment: string) => void;
}) {
  const totalPages = Math.max(Math.ceil(records.length / pageSize), 1);
  const visible = records.slice((page - 1) * pageSize, page * pageSize);

  const columns: DataTableColumn<any>[] = [
    {
      id: "student",
      header: "Learner",
      sortable: true,
      sortValue: (row) => row.student?.user?.name || row.student?.name || "",
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">
            {row.student?.user?.name || row.student?.name || "Learner"}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            {row.student?.studentCode || row.studentId}
          </p>
        </div>
      ),
    },
    {
      id: "score",
      header: "Score",
      cell: (row) => {
        const invalid = row.score !== "" && row.score !== null && Number(row.score) > maxScore;
        return (
          <div>
            <input
              type="number"
              min={0}
              max={maxScore}
              value={row.score ?? ""}
              disabled={locked}
              onChange={(event) => onScoreChange(row.studentId, event.target.value)}
              className={`h-10 w-28 rounded-lg border px-3 text-sm font-bold outline-none transition focus:ring-4 ${
                invalid
                  ? "border-rose-300 bg-rose-50 text-rose-700 focus:ring-rose-100"
                  : "border-slate-200 bg-white text-slate-900 focus:border-[#6d3eeb] focus:ring-purple-100"
              } disabled:bg-slate-50 disabled:text-slate-400`}
            />
            <p className="mt-1 text-[11px] font-bold text-slate-500">/{maxScore}</p>
          </div>
        );
      },
    },
    {
      id: "percentage",
      header: "Average",
      cell: (row) => {
        const score =
          row.score === "" || row.score === null || row.score === undefined
            ? null
            : Number(row.score);
        return (
          <span>
            {score === null || Number.isNaN(score)
              ? "-"
              : `${Math.round((score / maxScore) * 1000) / 10}%`}
          </span>
        );
      },
    },
    {
      id: "comment",
      header: "Comment",
      cell: (row) => (
        <input
          value={row.teacherComments ?? ""}
          disabled={locked}
          onChange={(event) => onCommentChange(row.studentId, event.target.value)}
          placeholder="Teacher note"
          className="h-10 w-full min-w-52 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-400"
        />
      ),
    },
    {
      id: "state",
      header: "Validation",
      cell: (row) => {
        const missing = row.score === "" || row.score === null || row.score === undefined;
        const invalid = !missing && Number(row.score) > maxScore;
        return (
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${missing ? "bg-amber-50 text-amber-700" : invalid ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
          >
            {missing ? "Missing" : invalid ? "Invalid" : "Ready"}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      data={visible}
      columns={columns}
      loading={loading}
      getRowId={(row) => row.studentId}
      emptyTitle="No assigned learners"
      emptyMessage="Choose a class and subject to load the assigned learners."
      pagination={{
        page,
        pageSize,
        total: records.length,
        totalPages,
        onPageChange,
        onPageSizeChange,
      }}
      mobileRender={(row) => (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">
                {row.student?.user?.name || row.student?.name || "Learner"}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {row.student?.studentCode || row.studentId}
              </p>
            </div>
            <Button size="xs" variant="secondary" disabled>
              <MessageSquare size={13} /> Note
            </Button>
          </div>
          <input
            type="number"
            min={0}
            max={maxScore}
            value={row.score ?? ""}
            disabled={locked}
            onChange={(event) => onScoreChange(row.studentId, event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100 disabled:bg-slate-50"
            placeholder={`Score out of ${maxScore}`}
          />
          <input
            value={row.teacherComments ?? ""}
            disabled={locked}
            onChange={(event) => onCommentChange(row.studentId, event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100 disabled:bg-slate-50"
            placeholder="Teacher note"
          />
        </div>
      )}
    />
  );
}
