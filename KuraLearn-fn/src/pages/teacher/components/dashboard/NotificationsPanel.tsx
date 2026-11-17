import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  DashboardPanel,
  DashboardSkeleton,
  InlineErrorState,
  InlineEmptyState,
  relativeTime,
} from "../../teacherShared";
import { useT } from "@/i18n/I18nContext";

export function NotificationsPanel({
  notifications,
  onOpenDetails,
}: {
  notifications: any;
  onOpenDetails: (item: any) => void;
}) {
  const t = useT();
  return (
    <DashboardPanel
      title={t("Notifications")}
      action={
        <Link to="/teacher/notifications" className="text-sm font-bold text-[#6d3eeb]">
          {t("View all")}
        </Link>
      }
    >
      {notifications.isLoading ? (
        <DashboardSkeleton />
      ) : notifications.error ? (
        <InlineErrorState
          message={(notifications.error as Error).message}
          onRetry={() => notifications.refetch()}
        />
      ) : notifications.data?.length ? (
        <div className="space-y-3">
          {notifications.data.slice(0, 5).map((item: any) => (
            <button
              key={item.id}
              onClick={() => onOpenDetails(item)}
              className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-slate-50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-purple-50 text-[#6d3eeb]">
                <Bell size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-slate-800">{item.body ?? item.title}</span>
                <span className="mt-1 block text-xs font-bold text-slate-500">{item.title}</span>
              </span>
              <span className="shrink-0 text-xs font-bold text-slate-500">
                {relativeTime(item.createdAt)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <InlineEmptyState message={t("No notifications right now.")} />
      )}
    </DashboardPanel>
  );
}
