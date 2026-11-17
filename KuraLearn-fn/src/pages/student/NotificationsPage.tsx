import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard } from "@/components/student/StudentShared";
import { useStudentNotifications } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw, BellOff } from "lucide-react";
import { useT } from "@/i18n/I18nContext";

export function NotificationsPage() {
  const t = useT();
  const { data, isLoading, error, refetch } = useStudentNotifications();

  if (isLoading) {
    return (
      <div>
        <PageHeader
          brand={t("KuraLearn Learning")}
          title={t("Notifications")}
          subtitle={t("Loading...")}
        />
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          brand={t("KuraLearn Learning")}
          title={t("Notifications")}
          subtitle={t("Error")}
        />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw size={48} className="mb-4 text-red-600" />
          <h3 className="text-xl font-bold">{t("Failed to load notifications")}</h3>
          <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
            {t("Retry")}
          </button>
        </div>
      </div>
    );
  }

  const notifications = data?.notifications || data || [];

  return (
    <div>
      <PageHeader
        brand={t("KuraLearn Learning")}
        title={t("Notifications")}
        subtitle={t("Learning reminders, rewards, messages and system updates.")}
      />
      <div className="grid gap-3">
        {notifications.length > 0 ? (
          notifications.map((item: any) => (
            <StudentCard
              key={item.id}
              className={item.read ? "" : "border-emerald-200 bg-emerald-50/40"}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="mt-1 font-bold text-slate-600">{item.body || item.message}</p>
                </div>
                {!item.read && (
                  <button className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold whitespace-nowrap">
                    {t("Mark read")}
                  </button>
                )}
              </div>
            </StudentCard>
          ))
        ) : (
          <div className="py-16 text-center">
            <BellOff size={48} className="mx-auto text-slate-500" />
            <p className="mt-4 text-xl font-bold text-slate-600">{t("No notifications")}</p>
            <p className="mt-1 text-slate-500">{t("You're all caught up!")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
