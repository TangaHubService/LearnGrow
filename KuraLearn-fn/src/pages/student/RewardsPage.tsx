import { Star, Gift, Flame, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard, StudentStat } from "@/components/student/StudentShared";
import { BadgeTile } from "@/components/student/BadgeTile";
import { useStudentDashboard } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { useT } from "@/i18n/I18nContext";

export function RewardsPage() {
  const t = useT();
  const { data, isLoading, error, refetch } = useStudentDashboard();

  if (isLoading) {
    return (
      <div>
        <PageHeader
          brand={t("KuraLearn Learning")}
          title={t("Rewards")}
          subtitle={t("Loading...")}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader brand={t("KuraLearn Learning")} title={t("Rewards")} subtitle={t("Error")} />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw size={48} className="mb-4 text-red-600" />
          <h3 className="text-xl font-bold">{t("Failed to load rewards")}</h3>
          <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
            {t("Retry")}
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const badges = data?.badges || [];
  const achievements = data?.achievements || [];

  return (
    <div>
      <PageHeader
        brand={t("KuraLearn Learning")}
        title={t("Rewards")}
        subtitle={t("Stars, badges, certificates, streaks and recent achievements.")}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StudentStat label={t("Stars")} value={stats.stars || 0} icon={Star} tone="#f59e0b" />
        <StudentStat
          label={t("Badges")}
          value={badges.filter((badge: any) => badge.earnedAt).length}
          icon={Gift}
          tone="#2563eb"
        />
        <StudentStat
          label={t("Streak")}
          value={`${stats.streak || 0} days`}
          icon={Flame}
          tone="#ef4444"
        />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <StudentCard>
          <h2 className="font-bold">{t("Badges")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {badges.length > 0 ? (
              badges.map((badge: any) => <BadgeTile key={badge.id} badge={badge} />)
            ) : (
              <p className="col-span-full py-8 text-center text-slate-500 font-bold italic">
                {t("No badges earned yet. Keep learning!")}
              </p>
            )}
          </div>
        </StudentCard>
        <StudentCard>
          <h2 className="font-bold">{t("Recent Achievements")}</h2>
          <div className="mt-4 space-y-3">
            {achievements.length > 0 ? (
              achievements.map((achievement: any) => (
                <div key={achievement.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-bold">{achievement.title}</p>
                  <p className="text-sm font-bold text-slate-500">
                    {achievement.description || achievement.courseTitle}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-slate-500 font-bold italic">
                {t("No certificates yet.")}
              </p>
            )}
          </div>
        </StudentCard>
      </div>
    </div>
  );
}
