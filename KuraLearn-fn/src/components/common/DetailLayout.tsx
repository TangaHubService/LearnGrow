import { ReactNode } from "react";
import {
  formatDate,
  formatCurrency,
  formatStatus,
  humanizeKey,
  inferType,
  isPrimitive,
  shouldHideKey,
} from "@/utils/formatters";
import { StatusBadge } from "./StatusBadge";

export function EmptyValue({ fallback = "Not provided" }: { fallback?: string }) {
  return <span className="font-normal text-slate-500">{fallback}</span>;
}

export function DetailCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <DetailCard>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-3 grid gap-3">{children}</div>
    </DetailCard>
  );
}

export function DetailRow({
  label,
  value,
  type = "text",
  fallback = "Not provided",
}: {
  label: string;
  value: unknown;
  type?: "text" | "date" | "currency" | "boolean" | "status" | "email" | "phone" | "number";
  fallback?: string;
}) {
  return (
    <div className="grid gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:grid-cols-[170px_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 text-sm font-normal text-slate-900">
        {renderFormattedValue(value, type, fallback)}
      </dd>
    </div>
  );
}

export function InfoGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-3">{children}</dl>;
}

function renderFormattedValue(
  value: unknown,
  type: "text" | "date" | "currency" | "boolean" | "status" | "email" | "phone" | "number",
  fallback: string,
) {
  if (value == null || value === "") return <EmptyValue fallback={fallback} />;
  if (type === "status") return <StatusBadge value={value} />;
  if (type === "boolean") return String(value) === "true" ? "Yes" : "No";
  if (type === "date") return formatDate(value);
  if (type === "currency") return formatCurrency(value);
  if (type === "number")
    return typeof value === "number" ? new Intl.NumberFormat("en-RW").format(value) : String(value);
  return String(value);
}

export function ReadableDetails({
  record,
  title = "Details",
}: {
  record: unknown;
  title?: string;
}) {
  if (record == null || record === "")
    return (
      <DetailSection title={title}>
        <EmptyValue />
      </DetailSection>
    );
  if (Array.isArray(record)) return <ArrayDetails title={title} items={record} />;
  if (typeof record !== "object")
    return (
      <DetailSection title={title}>
        <DetailRow label="Value" value={record} />
      </DetailSection>
    );

  const entries = Object.entries(record as Record<string, unknown>).filter(
    ([key]) => !shouldHideKey(key),
  );
  const primitives = entries.filter(([, value]) => isPrimitive(value));
  const nestedObjects = entries.filter(
    ([, value]) => value && typeof value === "object" && !Array.isArray(value),
  );
  const arrays = entries.filter(([, value]) => Array.isArray(value));

  return (
    <div className="space-y-4">
      {primitives.length ? (
        <DetailSection title={title}>
          <InfoGrid>
            {primitives.map(([key, value]) => (
              <DetailRow
                key={key}
                label={humanizeKey(key)}
                value={value}
                type={inferType(key, value)}
              />
            ))}
          </InfoGrid>
        </DetailSection>
      ) : null}
      {nestedObjects.map(([key, value]) => (
        <ReadableDetails key={key} record={value} title={humanizeKey(key)} />
      ))}
      {arrays.map(([key, value]) => (
        <ArrayDetails key={key} title={humanizeKey(key)} items={value as unknown[]} />
      ))}
    </div>
  );
}

function ArrayDetails({ title, items }: { title: string; items: unknown[] }) {
  if (!items.length)
    return (
      <DetailSection title={title}>
        <EmptyValue fallback="N/A" />
      </DetailSection>
    );
  const objectItems = items.filter(
    (item) => item && typeof item === "object" && !Array.isArray(item),
  ) as Record<string, unknown>[];
  if (objectItems.length === items.length) {
    const columns = Array.from(
      new Set(
        objectItems.flatMap((item) => Object.keys(item).filter((key) => !shouldHideKey(key))),
      ),
    ).slice(0, 5);
    return (
      <DetailSection title={title}>
        <div tabIndex={0} className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2">
                    {humanizeKey(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {objectItems.map((item, index) => (
                <tr key={index} className="border-t border-slate-100">
                  {columns.map((column) => (
                    <td key={column} className="px-3 py-3 font-normal text-slate-700">
                      {renderFormattedValue(item[column], inferType(column, item[column]), "N/A")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailSection>
    );
  }
  return (
    <DetailSection title={title}>
      <ul className="grid gap-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700"
          >
            {renderFormattedValue(item, inferType(title, item), "N/A")}
          </li>
        ))}
      </ul>
    </DetailSection>
  );
}
