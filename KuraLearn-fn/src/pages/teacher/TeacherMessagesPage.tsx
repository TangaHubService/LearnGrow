import { useQuery } from "@tanstack/react-query";
import { Bot, MessageSquare, Plus } from "lucide-react";
import { lmsService } from "@/services/lmsService";
import { openDrawer } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { Button, Card, PageHeader, Skeleton } from "./teacherShared";
import { TeacherGlobalUi } from "./TeacherGlobalUi";

export function TeacherMessagesPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useQuery({
    queryKey: ["teacher-messages"],
    queryFn: lmsService.messages,
  });

  return (
    <div>
      <PageHeader
        title="Communication"
        subtitle="Parents, students, staff, drafts, templates and AI message support."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                dispatch(
                  openDrawer({ kind: "ai-message", title: "AI parent message draft", mode: "ai" }),
                )
              }
            >
              <Bot size={16} /> AI draft
            </Button>
            <Button
              onClick={() =>
                dispatch(openDrawer({ kind: "message-form", title: "New message", mode: "create" }))
              }
            >
              <Plus size={16} /> New message
            </Button>
          </>
        }
      />
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data?.messages.map((message: any) => (
            <Card key={message.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{message.sender.name}</p>
                  <p className="text-sm font-bold text-slate-500">To {message.recipient.name}</p>
                </div>
                <MessageSquare className="text-[#6d3eeb]" />
              </div>
              <p className="mt-3 font-bold text-slate-700">{message.body}</p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() =>
                    dispatch(
                      openDrawer({
                        kind: "message-details",
                        title: "Conversation",
                        record: message,
                      }),
                    )
                  }
                >
                  Open thread
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <TeacherGlobalUi />
    </div>
  );
}
