import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard, StudentEmptyState, SecondaryLink } from "@/components/student/StudentShared";
import { useMessageThread } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw, Send } from "lucide-react";
import { useT } from "@/i18n/I18nContext";

export function MessageThreadPage() {
  const t = useT();
  const { threadId } = useParams<{ threadId: string }>();
  const { data, isLoading, error, refetch } = useMessageThread(threadId || "");

  if (isLoading) {
    return (
      <div>
        <PageHeader
          brand={t("KuraLearn Learning")}
          title={t("Conversation")}
          subtitle={t("Loading messages...")}
        />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data)
    return (
      <StudentEmptyState
        title={t("Thread not found")}
        message={t("Return to messages and choose another thread.")}
        action={
          <button
            onClick={() => refetch()}
            className="mt-4 text-indigo-600 font-bold flex items-center gap-2"
          >
            <RefreshCw size={16} /> {t("Retry")}
          </button>
        }
      />
    );

  const thread = data.thread || data;
  const messages = thread.messages || [];

  return (
    <div>
      <PageHeader
        brand={t("KuraLearn Learning")}
        title={thread.title || "Conversation"}
        subtitle={`Conversation with ${thread.otherParticipant?.name || "School"}`}
        actions={<SecondaryLink to="/messages">{t("Back")}</SecondaryLink>}
      />
      <StudentCard>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {messages.length > 0 ? (
            messages.map((message: any) => (
              <div
                key={message.id}
                className={`rounded-lg p-4 ${message.senderId === thread.studentId ? "bg-emerald-50 ml-8 border border-emerald-100" : "bg-slate-50 mr-8 border border-slate-100"}`}
              >
                <p className="font-bold text-xs uppercase tracking-wide text-slate-500 mb-1">
                  {message.sender?.name ||
                    (message.senderId === thread.studentId ? t("You") : t("Them"))}
                </p>
                <p className="font-bold text-slate-700">{message.body}</p>
                <p className="mt-2 text-[10px] font-bold text-slate-500">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-slate-500 font-bold italic">
              {t("No messages in this thread.")}
            </p>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            className="h-12 rounded-lg border border-slate-200 px-4 font-bold outline-none focus:border-emerald-500"
            placeholder={t("Write a message...")}
          />
          <button className="h-12 rounded-lg bg-emerald-700 px-6 font-bold text-white hover:bg-emerald-800 transition-colors flex items-center gap-2">
            <Send size={18} />
            <span>{t("Send")}</span>
          </button>
        </div>
      </StudentCard>
    </div>
  );
}
