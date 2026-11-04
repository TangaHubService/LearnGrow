import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard, PrimaryLink } from "@/components/student/StudentShared";
import { useStudentMessages } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw, MessageSquare } from "lucide-react";

export function MessagesPage() {
  const { data, isLoading, error, refetch } = useStudentMessages();

  if (isLoading) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Parent Connect" subtitle="Loading..." />
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
        <PageHeader brand="KuraLean Learning" title="Parent Connect" subtitle="Error" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw size={48} className="mb-4 text-red-600" />
          <h3 className="text-xl font-bold">Failed to load messages</h3>
          <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const threads = data?.threads || data || [];

  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title="Parent Connect"
        subtitle="Messages from parents, teacher feedback, and school notices."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {threads.length > 0 ? (
          threads.map((thread: any, idx: number) => (
            <StudentCard key={thread.id ?? idx}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">{thread.title || "Message Thread"}</h2>
                  <p className="font-bold text-slate-500">
                    From {thread.otherParticipant?.name || "School"}
                  </p>
                </div>
                {thread.unreadCount > 0 ? (
                  <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {thread.unreadCount} Unread
                  </span>
                ) : null}
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-3 font-bold text-slate-700 line-clamp-2">
                {thread.lastMessage?.body || "No messages yet."}
              </div>
              <div className="mt-4">
                <PrimaryLink to={`/messages/${thread.id}`}>Open thread</PrimaryLink>
              </div>
            </StudentCard>
          ))
        ) : (
          <div className="col-span-full py-16 text-center">
            <MessageSquare size={48} className="mx-auto text-slate-500" />
            <p className="mt-4 text-xl font-bold text-slate-600">No messages yet</p>
            <p className="mt-1 text-slate-500">
              When you receive messages from teachers or parents, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
