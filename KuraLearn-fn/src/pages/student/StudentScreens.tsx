export { DashboardPage } from "./DashboardPage";
export { SubjectsPage } from "./SubjectsPage";
export { CoursesPage } from "./CoursesPage";
export { LearningPathPage } from "./LearningPathPage";
export { PracticePage } from "./PracticePage";
export { QuizPage } from "./QuizPage";
export { QuizResultsPage } from "./QuizResultsPage";
export { AnalyticsPage } from "./AnalyticsPage";
export { RewardsPage } from "./RewardsPage";
export { LibraryPage } from "./LibraryPage";
export { ResourceDetailPage } from "./ResourceDetailPage";
export { GoalsPage } from "./GoalsPage";
export { ProfilePage } from "./ProfilePage";
export { ProfileSetupPage } from "./ProfileSetupPage";
export { MessagesPage } from "./MessagesPage";
export { MessageThreadPage } from "./MessageThreadPage";
export { NotificationsPage } from "./NotificationsPage";
export { SettingsPage } from "./SettingsPage";
export { AiAssistantPage } from "./AiAssistantPage";
export { StudentMarksPage } from "./StudentMarksPage";
export { StudentTimetablePage } from "./StudentTimetablePage";
export { StudentExamsPage } from "./StudentExamsPage";
export { StudentAttendancePage } from "./StudentAttendancePage";

import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard, PrimaryLink } from "@/components/student/StudentShared";
import { EmptyState } from "@/components/common/States";
import { useT } from "@/i18n/I18nContext";

export function ComingSoonPage({ title = "Coming soon" }: { title?: string }) {
  const t = useT();
  return (
    <div>
      <PageHeader
        brand={t("KuraLearn Learning")}
        title={title}
        subtitle={t(
          "This role area is scaffolded and protected while the student learning flow comes first.",
        )}
      />
      <StudentCard>
        <p className="font-bold text-slate-600">
          {t("The backend has role-based routes ready for expansion.")}
        </p>
        <div className="mt-4">
          <PrimaryLink to="/">{t("Back to dashboard")}</PrimaryLink>
        </div>
      </StudentCard>
    </div>
  );
}

export function AdminPlaceholderPage() {
  const t = useT();
  const { resource } = useParams();
  const { user } = useAuth();
  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
    return (
      <EmptyState
        title={t("Admin access blocked")}
        message={t("Students cannot access admin routes.")}
      />
    );
  }
  return <ComingSoonPage title={`Admin ${resource ?? "module"}`} />;
}
