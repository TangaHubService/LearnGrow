import { Card } from "./Card";
import { Skeleton } from "./Skeleton";

export function LoadingState({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse p-0 overflow-hidden">
          {/* Header gradient skeleton */}
          <div className="h-24 bg-slate-100 p-4 flex items-end">
            <Skeleton className="h-4 w-24 rounded bg-slate-200" />
          </div>

          <div className="p-4 space-y-3">
            {/* Title skeleton */}
            <Skeleton className="h-5 w-4/5 rounded bg-slate-200" />
            <Skeleton className="h-5 w-2/3 rounded bg-slate-200" />

            {/* Description skeleton */}
            <div className="space-y-1.5 pt-2">
              <Skeleton className="h-3 w-full rounded bg-slate-200" />
              <Skeleton className="h-3 w-5/6 rounded bg-slate-200" />
            </div>

            {/* Bottom info skeleton */}
            <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
              <Skeleton className="h-4 w-14 rounded bg-slate-200" />
              <Skeleton className="h-4 w-14 rounded bg-slate-200" />
              <Skeleton className="h-4 w-16 rounded bg-slate-200" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
