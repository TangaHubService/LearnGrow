import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard, StudentEmptyState, SecondaryLink } from "@/components/student/StudentShared";
import { useMessageThread } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw, Send } from "lucide-react";

export function MessageThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { data, isLoading, error, refetch } = useMessageThread(threadId || "");

  if (isLoading) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Conversation" subtitle="Loading messages..." />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data)
    return (
      <StudentEmptyState
        title="Thread not found"
        message="Return to messages and choose another thread."
        action={
          <button
            onClick={() => refetch()}
            className="mt-4 text-indigo-600 font-bold flex items-center gap-2"
          >
            <RefreshCw size={16} /> Retry
          </button>
        }
      />
    );

  const thread = data.thread || data;
  const messages = thread.messages || [];

  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title={thread.title || "Conversation"}
        subtitle={`Conversation with ${thread.otherParticipant?.name || "School"}`}
        actions={<SecondaryLink to="/messages">Back</SecondaryLink>}
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
                  {message.sender?.name || (message.senderId === thread.studentId ? "You" : "Them")}
                </p>
                <p className="font-bold text-slate-700">{message.body}</p>
                <p className="mt-2 text-[10px] font-bold text-slate-500">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-slate-500 font-bold italic">
              No messages in this thread.
            </p>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            className="h-12 rounded-lg border border-slate-200 px-4 font-bold outline-none focus:border-emerald-500"
            placeholder="Write a message..."
          />
          <button className="h-12 rounded-lg bg-emerald-700 px-6 font-bold text-white hover:bg-emerald-800 transition-colors flex items-center gap-2">
            <Send size={18} />
            <span>Send</span>
          </button>
        </div>
      </StudentCard>
    </div>
  );
}
