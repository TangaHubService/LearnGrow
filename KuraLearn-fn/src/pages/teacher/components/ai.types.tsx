import type { ReactNode } from "react";

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  parsed?: any;
}

export interface AiConversationSummary {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messageCount: number;
  taskType?: string;
}

export function formatAiResponse(data: any): ReactNode {
  if (!data) return null;
  const { title, sections, readyToUse, estimatedDuration, materials, recommendations } = data;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          {estimatedDuration ? (
            <p className="text-sm text-slate-500">Duration: {estimatedDuration}</p>
          ) : null}
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${readyToUse ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
        >
          {readyToUse ? "Ready to use" : "Teacher review needed"}
        </span>
      </div>
      {materials?.length > 0 ? (
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Teaching and learning materials
          </p>
          <div className="flex flex-wrap gap-2">
            {materials.map((item: string, index: number) => (
              <span
                key={index}
                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {(sections ?? []).map((section: any, index: number) => (
        <div key={index} className="rounded-lg bg-white p-4">
          <h4 className="mb-2 font-semibold text-[#10a37f]">{section.heading}</h4>
          {section.content ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {section.content}
            </p>
          ) : null}
          {section.items?.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {section.items.map((item: string, itemIndex: number) => (
                <li
                  key={itemIndex}
                  className="flex items-start gap-2 text-sm leading-6 text-slate-600"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#10a37f]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
      {recommendations?.length > 0 ? (
        <div className="rounded-lg bg-green-50 p-3">
          <p className="mb-2 text-sm font-semibold text-green-800">Recommended next actions</p>
          <ul className="space-y-1">
            {recommendations.map((item: string, index: number) => (
              <li key={index} className="text-sm leading-6 text-green-700">
                - {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
