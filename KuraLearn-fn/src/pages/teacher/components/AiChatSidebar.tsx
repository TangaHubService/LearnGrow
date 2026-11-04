import { Loader2, MessageSquare, MoreHorizontal, Plus } from "lucide-react";
import type { AiConversationSummary } from "./ai.types";

interface AiChatSidebarProps {
  conversations: AiConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  loading: boolean;
}

export function AiChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  loading,
}: AiChatSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d3eeb] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#5b2fd4]"
        >
          <Plus size={16} />
          New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
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
                onClick={() => onSelect(conv.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left transition ${activeId === conv.id ? "bg-purple-50 border border-purple-200" : "hover:bg-slate-50 border border-transparent"}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="truncate text-sm font-semibold text-slate-800">
                    {conv.title || "Chat"}
                  </span>
                  <button
                    aria-label="More options"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="shrink-0 rounded p-0.5 text-slate-500 hover:bg-slate-100"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{conv.lastMessage}</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[10px] font-medium text-slate-500">
                    {conv.messageCount} messages
                  </span>
                  {conv.taskType ? (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {conv.taskType}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
