import { Bot, Copy, Download, Save, Sparkles } from "lucide-react";
import { aiResponseToText } from "../utils/teacher.utils";
import { formatAiResponse } from "./ai.types";
import type { AiMessage } from "./ai.types";

interface AiChatBubbleProps {
  message: AiMessage;
  onCopy: (text: string) => void;
  onSave: (text: string, title: string) => void;
  onDownload: (text: string, title: string) => void;
  onUseAsPrepared?: (parsed: any) => void;
}

export function AiChatBubble({
  message,
  onCopy,
  onSave,
  onDownload,
  onUseAsPrepared,
}: AiChatBubbleProps) {
  const isUser = message.role === "user";
  const parsed = message.parsed;
  const plainText = parsed ? aiResponseToText(parsed) : message.content;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? "bg-[#10a37f]" : "bg-[#10a37f]/10"}`}
      >
        {isUser ? (
          <span className="text-xs font-bold text-white">T</span>
        ) : (
          <Bot size={16} className="text-[#10a37f]" />
        )}
      </div>
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-3 ${isUser ? "bg-[#10a37f] text-white" : "text-slate-900"}`}
        >
          {parsed ? (
            <div className="space-y-3">
              {formatAiResponse(parsed)}
              {!isUser && (
                <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                  <button
                    onClick={() => onCopy(plainText)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                  >
                    <Copy size={13} /> Copy
                  </button>
                  <button
                    onClick={() => onSave(plainText, parsed?.title || "AI Output")}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                  >
                    <Save size={13} /> Save
                  </button>
                  <button
                    onClick={() => onDownload(plainText, parsed?.title || "ai-output")}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                  >
                    <Download size={13} /> Download
                  </button>
                  {onUseAsPrepared && (
                    <button
                      onClick={() => onUseAsPrepared(parsed)}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-200"
                    >
                      <Sparkles size={13} /> Use as prepared
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
          )}
        </div>
        <span className={`text-[11px] text-slate-500 ${isUser ? "mr-1" : "ml-1"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
