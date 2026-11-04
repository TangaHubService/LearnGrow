import { useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { resizeAiTextarea } from "../utils/teacher.utils";

interface AiInputBarProps {
  prompt: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  isGenerating: boolean;
}

export function AiInputBar({
  prompt,
  onChange,
  onSubmit,
  disabled,
  isGenerating,
}: AiInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
    resizeAiTextarea(event.target);
  }

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-slate-400 focus-within:shadow-md">
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxLength={10000}
        placeholder="Message AI Assistant..."
        className="max-h-[200px] min-h-[48px] w-full resize-none rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">{prompt.length}/10000</span>
        <button
          aria-label="Send message"
          onClick={onSubmit}
          disabled={disabled || !prompt.trim() || isGenerating}
          className="flex items-center gap-2 rounded-lg bg-[#10a37f] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#0d8c6d] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}
