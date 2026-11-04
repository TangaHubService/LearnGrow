import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Loader2, MessageSquare, Plus } from "lucide-react";
import { lmsService } from "@/services/lmsService";
import { pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { aiResponseToText, initialAiPrompt } from "../utils/teacher.utils";
import { AiChatBubble } from "./AiChatBubble";
import { AiInputBar } from "./AiInputBar";
import type { AiMessage, AiConversationSummary } from "./ai.types";

export function AiApprovalBody({
  kind,
  record,
  embedded = false,
}: {
  kind: string;
  record: any;
  embedded?: boolean;
}) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const seedPrompt = useMemo(() => initialAiPrompt(kind, record), [kind, record]);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [prompt, setPrompt] = useState(seedPrompt);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const savedOutputs = useQuery({
    queryKey: ["teacher-ai-outputs"],
    queryFn: () => lmsService.getAiOutputs(),
    enabled: embedded,
  });

  const conversationsQuery = useQuery({
    queryKey: ["teacher-ai-conversations"],
    queryFn: () => lmsService.aiConversations(),
    enabled: embedded,
  });

  const conversations: AiConversationSummary[] =
    (conversationsQuery.data as any)?.conversations ?? [];

  useEffect(() => {
    if (seedPrompt && messages.length === 0) {
      setPrompt(seedPrompt);
    }
  }, [seedPrompt, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const aiMutation = useMutation({
    mutationFn: (description: string) =>
      lmsService.aiComprehensive({
        teacherRequest: description,
        performanceData: record ? { sourceRecord: record } : undefined,
      }),
    onSuccess: (data) => {
      const assistantMessage: AiMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: aiResponseToText(data),
        timestamp: new Date(),
        parsed: data,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsGenerating(false);
      setError("");
      dispatch(pushToast({ tone: "success", message: "AI content generated" }));
    },
    onError: () => {
      const msg = "AI could not generate the response. Please try again.";
      setError(msg);
      setIsGenerating(false);
      dispatch(pushToast({ tone: "error", message: msg }));
    },
  });

  function submit() {
    const description = prompt.trim();
    if (!description) return;
    if (description.length < 10) {
      const msg = "Add a little more detail so the AI can prepare useful content.";
      setError(msg);
      dispatch(pushToast({ tone: "error", message: msg }));
      return;
    }

    const userMessage: AiMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: description,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);
    setError("");
    aiMutation.mutate(description);
    setPrompt("");
  }

  function copyText(text: string) {
    navigator.clipboard?.writeText(text);
    dispatch(pushToast({ tone: "success", message: "Copied to clipboard" }));
  }

  async function saveOutput(text: string, title: string) {
    try {
      await lmsService.saveAiOutput({
        taskType: messages[messages.length - 1]?.parsed?.taskType || "lesson_preparation",
        title,
        output: text,
        teacherRequest: messages[0]?.content || "",
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-ai-outputs"] });
      dispatch(pushToast({ tone: "success", message: "Saved to AI outputs" }));
    } catch {
      dispatch(pushToast({ tone: "error", message: "Could not save. Try again." }));
    }
  }

  function downloadOutput(text: string, title: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "ai-output"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function useAsPrepared(parsed: any) {
    if (
      parsed?.sections?.[0]?.heading?.toLowerCase().includes("lesson") ||
      parsed?.title?.toLowerCase().includes("lesson")
    ) {
      const text = aiResponseToText(parsed);
      setPrompt(
        `Use this lesson plan content as the body for lesson creation. Here is the full AI output:\n\n${text}`,
      );
      dispatch(pushToast({ tone: "info", message: "Paste content into the lesson form below." }));
    }
  }

  function newChat() {
    setMessages([]);
    setPrompt(initialAiPrompt(kind, record));
    setActiveConversationId(null);
  }

  function handleConversationSelect(id: string) {
    setActiveConversationId(id);
    dispatch(pushToast({ tone: "info", message: "Conversation loading..." }));
  }

  const hasContent = messages.length > 0;

  return (
    <div className="flex h-full min-h-0 bg-white">
      <aside
        className={`w-72 shrink-0 border-r border-slate-200 bg-[#f7f7f7] transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-3">
          <button
            onClick={newChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Plus size={16} />
            New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <div className="px-2 pb-2 pt-2">
            <p className="px-2 text-xs font-semibold text-slate-600 uppercase">History</p>
          </div>
          {conversationsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="animate-spin text-slate-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <MessageSquare size={20} className="mx-auto mb-2 text-slate-500" />
              <p className="text-xs font-medium text-slate-500">No conversations yet</p>
              <p className="mt-1 text-[11px] text-slate-500">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleConversationSelect(conv.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition ${activeConversationId === conv.id ? "bg-slate-200" : "hover:bg-slate-100"}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="truncate text-sm font-medium text-slate-700">
                      {conv.title || "Chat"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{conv.lastMessage}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="flex flex-col min-w-0 flex-1 h-full">
        <div className="flex items-center border-b border-slate-200 px-4 py-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Hide chat history" : "Show chat history"}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            {sidebarOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M15 3v18" />
                <path d="M9 3h6" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!hasContent && !isGenerating ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#10a37f]/10">
                <Bot size={28} className="text-[#10a37f]" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">How can I help you today?</h3>
              <p className="mt-3 max-w-lg text-sm text-slate-500">
                I can help you create lesson plans, quizzes, parent messages, classroom activities,
                and more.
              </p>
              <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3">
                {[
                  { label: "Lesson plan", hint: "with objectives & activities" },
                  { label: "Quiz / Assessment", hint: "questions & answers" },
                  { label: "Parent message", hint: "clear & supportive" },
                  { label: "Classroom activity", hint: "engaging & fun" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() =>
                      setPrompt(`Prepare a ${item.label.toLowerCase()} for my class. ${item.hint}.`)
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <span className="block text-sm font-semibold text-slate-800">{item.label}</span>
                    <span className="text-xs text-slate-500">{item.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 pb-4">
              {messages.map((msg) => (
                <AiChatBubble
                  key={msg.id}
                  message={msg}
                  onCopy={copyText}
                  onSave={saveOutput}
                  onDownload={downloadOutput}
                  onUseAsPrepared={useAsPrepared}
                />
              ))}
              {isGenerating && (
                <div className="flex items-center gap-3 px-4 py-4">
                  <Loader2 size={18} className="animate-spin text-[#10a37f]" />
                  <span className="text-sm font-medium text-slate-600">Thinking...</span>
                </div>
              )}
              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <AiInputBar
              prompt={prompt}
              onChange={setPrompt}
              onSubmit={submit}
              disabled={isGenerating}
              isGenerating={isGenerating}
            />
            <p className="mt-2 text-center text-[11px] text-slate-500">
              AI can make mistakes. Please verify before use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
