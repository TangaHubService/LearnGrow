export function ApprovalTimeline({ events = [] }: { events?: any[] }) {
  if (!events.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
        No approval timeline events yet.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {String(event.action || "").replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {event.actor?.name || "System"}{" "}
                {event.fromStatus ? `changed ${event.fromStatus} to ${event.toStatus}` : ""}
              </p>
            </div>
            <time className="text-xs font-bold text-slate-500">
              {event.createdAt
                ? new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(event.createdAt))
                : ""}
            </time>
          </div>
          {event.comment ? (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              {event.comment}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
