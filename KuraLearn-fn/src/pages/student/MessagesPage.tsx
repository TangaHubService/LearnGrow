import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard, PrimaryLink } from "@/components/student/StudentShared";
import { useStudentMessages } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw, MessageSquare } from "lucide-react";
import { useT } from "@/i18n/I18nContext";

export function MessagesPage() {
  const t = useT();
  const { data, isLoading, error, refetch } = useStudentMessages();

  if (isLoading) {
    return (
      <div>
        <PageHeader
          brand={t("KuraLearn Learning")}
          title={t("Parent Connect")}
          subtitle={t("Loading...")}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
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
          title={t("Parent Connect")}
          subtitle={t("Error")}
        />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw size={48} className="mb-4 text-red-600" />
          <h3 className="text-xl font-bold">{t("Failed to load messages")}</h3>
          <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
            {t("Retry")}
          </button>
        </div>
      </div>
    );
  }

  const threads = data?.threads || data || [];

  return (
    <div>
      <PageHeader
        brand={t("KuraLearn Learning")}
        title={t("Parent Connect")}
        subtitle={t("Messages from parents, teacher feedback, and school notices.")}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {threads.length > 0 ? (
          threads.map((thread: any, idx: number) => (
            <StudentCard key={thread.id ?? idx}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">{thread.title || t("Message thread")}</h2>
                  <p className="font-bold text-slate-500">
                    {t("From {name}", { name: thread.otherParticipant?.name || t("School") })}
                  </p>
                </div>
                {thread.unreadCount > 0 ? (
                  <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {thread.unreadCount} {t("Unread")}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-3 font-bold text-slate-700 line-clamp-2">
                {thread.lastMessage?.body || "No messages yet."}
              </div>
              <div className="mt-4">
                <PrimaryLink to={`/messages/${thread.id}`}>{t("Open thread")}</PrimaryLink>
              </div>
            </StudentCard>
          ))
        ) : (
          <div className="col-span-full py-16 text-center">
            <MessageSquare size={48} className="mx-auto text-slate-500" />
            <p className="mt-4 text-xl font-bold text-slate-600">{t("No messages yet")}</p>
            <p className="mt-1 text-slate-500">
              {t("When you receive messages from teachers or parents, they will appear here.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
