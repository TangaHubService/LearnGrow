import { useQuery } from "@tanstack/react-query";
import { lmsService } from "@/services/lmsService";
import { Card, PageHeader } from "./teacherShared";

export function TeacherNotificationsPage() {
  const { data } = useQuery({
    queryKey: ["teacher-notifications"],
    queryFn: lmsService.notifications,
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Messages, quiz completion, student risk alerts, reminders and announcements."
      />
      <div className="grid gap-3">
        {data?.notifications.map((item: any) => (
          <Card key={item.id} className={!item.readAt ? "border-purple-200 bg-purple-50/40" : ""}>
            <p className="font-bold">{item.title}</p>
            <p className="font-bold text-slate-600">{item.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
