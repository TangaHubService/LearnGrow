import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { History, Plus } from "lucide-react";
import { studentApi, type AiConversationMessage, type AiConversationSummary } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard } from "@/components/student/StudentShared";

type AiChatItem = { role: "user" | "assistant"; content: string };

const aiGreeting: AiChatItem = {
  role: "assistant",
  content:
    "Hi. I am KuraLean AI Tutor. I can explain, translate, give hints, and help you practice safely.",
};

function formatChatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getConversationPreview(conversation: AiConversationSummary) {
  return conversation.messages[0]?.content ?? "No messages yet";
}

function toChatItems(messages: AiConversationMessage[]): AiChatItem[] {
  const chatItems = messages
    .filter((item) => item.role !== "SYSTEM")
    .map((item) => ({
      role: item.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: item.content,
    }));

  return chatItems.length ? chatItems : [aiGreeting];
}

export function AiAssistantPage() {
  const [searchParams] = useSearchParams();
  const defaultPrompt =
    searchParams.get("mode") === "translate"
      ? "Translate this lesson to Kinyarwanda."
      : "Can you explain this in simple words?";
  const lessonId = searchParams.get("lessonId") ?? undefined;
  const [message, setMessage] = useState(defaultPrompt);
  const [messages, setMessages] = useState<AiChatItem[]>([aiGreeting]);
  const [conversationId, setConversationId] = useState<string>();
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [historyError, setHistoryError] = useState("");

  async function loadConversationHistory(activeConversationId = conversationId) {
    setIsHistoryLoading(true);
    setHistoryError("");
    try {
      const result = await studentApi.aiConversations();
      setConversations(result.conversations);
      if (
        activeConversationId &&
        !result.conversations.some((item) => item.id === activeConversationId)
      ) {
        setConversationId(undefined);
      }
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Could not load chat history.");
    } finally {
      setIsHistoryLoading(false);
    }
  }

  useEffect(() => {
    void loadConversationHistory();
  }, []);

  async function openConversation(id: string) {
    setIsConversationLoading(true);
    setHistoryError("");
    try {
      const result = await studentApi.aiConversation(id);
      setConversationId(result.conversation.id);
      setMessages(toChatItems(result.conversation.messages));
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Could not open this chat.");
    } finally {
      setIsConversationLoading(false);
    }
  }

  function startNewChat() {
    setConversationId(undefined);
    setMessages([aiGreeting]);
    setMessage(defaultPrompt);
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const outgoingMessage = message.trim();
    if (!outgoingMessage || isSending) return;
    const next = [...messages, { role: "user" as const, content: outgoingMessage }];
    setMessages(next);
    setMessage("");
    setIsSending(true);
    try {
      const result = await studentApi.aiChat({
        message: outgoingMessage,
        lessonId,
        conversationId,
      });
      const activeConversationId = result.conversationId ?? conversationId;
      setConversationId(activeConversationId);
      setMessages([...next, { role: "assistant", content: result.reply }]);
      await loadConversationHistory(activeConversationId);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Let's work step by step. I can give a hint, but during a quiz I will not reveal the direct answer.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }
  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title="AI Learning Assistant"
        subtitle="Ask questions about your lessons, continue saved conversations from the sidebar, and get safe step-by-step explanations, translations, hints, and practice support in simple language."
        actions={
          <button
            onClick={startNewChat}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
          >
            <Plus size={16} /> New chat
          </button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside>
          <StudentCard className="p-0">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-bold text-slate-950">
                  <History size={18} className="text-emerald-700" /> Chat history
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">Saved conversations</p>
              </div>
              <button
                onClick={startNewChat}
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              >
                <Plus size={15} /> New chat
              </button>
            </div>
            <div className="max-h-[560px] overflow-y-auto p-3">
              {isHistoryLoading ? (
                <p className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-500">
                  Loading chats...
                </p>
              ) : null}
              {!isHistoryLoading && conversations.length ? (
                <div className="grid gap-2">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => openConversation(conversation.id)}
                      className={`rounded-lg border px-3 py-3 text-left transition ${conversationId === conversation.id ? "border-emerald-300 bg-emerald-50" : "border-transparent hover:bg-slate-50"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {conversation.title || "AI tutor chat"}
                        </p>
                        <span className="shrink-0 text-[11px] font-bold text-slate-500">
                          {formatChatDate(conversation.updatedAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-bold text-slate-500">
                        {getConversationPreview(conversation)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}
              {!isHistoryLoading && !conversations.length ? (
                <p className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-500">
                  No saved chats yet.
                </p>
              ) : null}
              {historyError ? (
                <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  {historyError}
                </p>
              ) : null}
            </div>
          </StudentCard>
        </aside>
        <StudentCard className="flex min-h-[620px] flex-col">
          <form
            onSubmit={send}
            className="grid gap-3 border-b border-slate-100 pb-5 sm:grid-cols-[1fr_auto]"
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="h-12 rounded-lg border border-slate-200 px-4 font-bold"
              placeholder="Ask about a lesson"
            />
            <button
              disabled={isSending || !message.trim()}
              className="h-12 rounded-lg bg-emerald-700 px-5 font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSending ? "Sending" : "Send"}
            </button>
          </form>
          {isConversationLoading ? (
            <span className="mt-4 w-fit rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              Opening...
            </span>
          ) : null}
          <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`max-w-[82%] rounded-lg p-4 font-bold ${item.role === "assistant" ? "bg-slate-100 text-slate-700" : "ml-auto bg-emerald-700 text-white"}`}
              >
                {item.content}
              </div>
            ))}
          </div>
        </StudentCard>
      </div>
    </div>
  );
}
