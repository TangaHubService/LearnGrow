import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "./Card";

export function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-rose-100 bg-rose-50 text-rose-700">
      <p className="text-sm font-bold">Something needs attention</p>
      <p className="mt-0.5 text-sm font-medium">{message}</p>
    </Card>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <Card className="py-8 text-center">
      <p className="text-lg font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function InlineEmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
      <div>
        <p className="font-bold text-slate-500">{message}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

export function InlineErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
      <p className="font-bold">Could not load this section.</p>
      <p className="mt-1 text-sm font-bold">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-bold text-white"
      >
        <RefreshCw size={15} /> Retry
      </button>
    </div>
  );
}
