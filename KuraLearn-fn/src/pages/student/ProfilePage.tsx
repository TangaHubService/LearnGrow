import { User, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard, SecondaryLink } from "@/components/student/StudentShared";
import { BadgeTile } from "@/components/student/BadgeTile";
import { useStudentProfile, useStudentDashboard } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";

export function ProfilePage() {
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useStudentProfile();
  const { data: dashboardData, isLoading: dashboardLoading } = useStudentDashboard();

  if (profileLoading || dashboardLoading) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Student profile" subtitle="Loading..." />
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Student profile" subtitle="Error" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw size={48} className="mb-4 text-red-600" />
          <h3 className="text-xl font-bold">Failed to load profile</h3>
          <button onClick={() => refetchProfile()} className="mt-4 text-indigo-600 font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const student = profileData?.student || profileData;
  const badges = dashboardData?.dashboard?.recentBadges || dashboardData?.recentBadges || [];

  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title="Student profile"
        subtitle="Certificates, achievements, activity history and profile settings."
        actions={<SecondaryLink to="/profile-setup">Edit profile</SecondaryLink>}
      />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <StudentCard>
          <div className="grid place-items-center text-center">
            <span className="grid h-24 w-24 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <User size={42} />
            </span>
            <h2 className="mt-4 text-2xl font-bold">{student.user?.name || student.name}</h2>
            <p className="font-bold text-slate-500">
              {student.level?.name || student.level} -{" "}
              {student.class?.name || student.className || "Unassigned"}
            </p>
            <p className="font-bold text-slate-500">
              {student.school?.name || student.schoolName || "KuraLean School"}
            </p>
          </div>
        </StudentCard>
        <StudentCard>
          <h2 className="font-bold">Achievements</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {badges.length > 0 ? (
              badges.map((badge: any) => <BadgeTile key={badge.id} badge={badge} />)
            ) : (
              <p className="col-span-2 py-8 text-center text-slate-500">No achievements yet.</p>
            )}
          </div>
        </StudentCard>
      </div>
    </div>
  );
}
