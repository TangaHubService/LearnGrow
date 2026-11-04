import type { ReactNode } from "react";

export function DashboardPageLayout({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-5 ${className}`}>
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#0b1f4d] sm:text-3xl">{title}</h1>
          {subtitle ? (
            <div className="mt-1 text-sm font-semibold leading-6 text-slate-500">{subtitle}</div>
          ) : null}
        </div>
        {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
      </header>
      {children}
    </div>
  );
}

export function DashboardHeaderPill({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm">
      {children}
    </div>
  );
}

export function DashboardStatGrid({
  children,
  columns = "auto",
}: {
  children: ReactNode;
  columns?: "auto" | "four" | "five" | "six";
}) {
  const classes = {
    auto: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
    four: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
    five: "grid gap-4 md:grid-cols-2 xl:grid-cols-5",
    six: "grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6",
  };

  return <section className={classes[columns]}>{children}</section>;
}

export function DashboardPanel({
  title,
  action,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-bold text-[#0b1f4d]">{title}</h2>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
