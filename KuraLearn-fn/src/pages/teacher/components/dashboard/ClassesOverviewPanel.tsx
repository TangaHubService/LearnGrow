import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DashboardPanel,
  DashboardSkeleton,
  InlineErrorState,
  InlineEmptyState,
  displayDate,
} from "../../teacherShared";
import { ModernTable } from "@/components/ModernUi";
import { useTeacherClassAttendance } from "@/hooks/useTeacherDashboard";
import {
  AttendanceRangeFilter,
  presetRange,
  type AttendanceRangeKey,
  type DateRange,
} from "./AttendanceRangeFilter";
import { ClassAttendanceChart } from "./ClassAttendanceChart";

export function ClassesOverviewPanel({ classes }: { classes: any }) {
  const [rangeKey, setRangeKey] = useState<AttendanceRangeKey>("30d");
  const [customRange, setCustomRange] = useState<DateRange>(() => presetRange("30d"));

  const range = rangeKey === "custom" ? customRange : presetRange(rangeKey);
  const rangeIsValid = Boolean(range.from && range.to && range.from <= range.to);
  const attendance = useTeacherClassAttendance(rangeIsValid ? range : null);

  const attendanceByClass = useMemo(
    () => new Map((attendance.data ?? []).map((row) => [row.classId, row])),
    [attendance.data],
  );
  const hasAttendance = attendance.data?.some((row) => row.rate !== null) ?? false;

  return (
    <DashboardPanel
      title="My Classes Overview"
      action={
        <Link to="/teacher/classes" className="text-sm font-bold text-[#6d3eeb]">
          View all
        </Link>
      }
    >
      {classes.isLoading ? (
        <DashboardSkeleton />
      ) : classes.error ? (
        <InlineErrorState
          message={(classes.error as Error).message}
          onRetry={() => classes.refetch()}
        />
      ) : classes.data?.length ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <AttendanceRangeFilter
              selected={rangeKey}
              customRange={customRange}
              onSelect={setRangeKey}
              onCustomRangeChange={setCustomRange}
            />
            <div>
              <p className="text-sm font-bold text-slate-900">Attendance by class</p>
              <p className="text-xs text-slate-500">
                Share of learners marked present or late in the selected period
              </p>
            </div>
            {!rangeIsValid ? (
              <p className="text-sm font-semibold text-rose-700">
                Choose a start date that is on or before the end date.
              </p>
            ) : attendance.isLoading ? (
              <DashboardSkeleton />
            ) : attendance.error ? (
              <InlineErrorState
                message={(attendance.error as Error).message}
                onRetry={() => attendance.refetch()}
              />
            ) : hasAttendance ? (
              <div className={attendance.isPlaceholderData ? "opacity-60" : undefined}>
                <ClassAttendanceChart items={attendance.data ?? []} />
              </div>
            ) : (
              <InlineEmptyState message="No attendance marked in this period. Try a longer period." />
            )}
          </div>
          <ModernTable
            data={classes.data}
            columns={[
              { header: "Class", accessor: "className" },
              { header: "Subject", accessor: "subjectName" },
              { header: "Learners", accessor: "learnerCount" },
              {
                header: "Next Lesson",
                accessor: (row: any) => (
                  <div>
                    <span className="block font-semibold">
                      {row.nextLesson?.topic ?? "Not scheduled"}
                    </span>
                    {row.nextLesson ? (
                      <span className="text-[10px] text-slate-500">
                        {displayDate(row.nextLesson.scheduledAt)}
                      </span>
                    ) : null}
                  </div>
                ),
              },
              {
                header: "Attendance",
                accessor: (row: any) => {
                  const record = attendanceByClass.get(row.classId);
                  if (!record) return "–";
                  if (record.rate === null) return "No record";
                  return (
                    <span className="text-emerald-700 font-bold">
                      {record.rate}% ({record.present + record.late}/{record.total})
                    </span>
                  );
                },
              },
            ]}
          />
        </div>
      ) : (
        <InlineEmptyState message="No classes assigned to you yet." />
      )}
    </DashboardPanel>
  );
}
