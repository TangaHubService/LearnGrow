export function formatDate(value: unknown) {
  if (value == null || value === "") return "N/A";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatCurrency(value: unknown) {
  if (value == null || value === "") return "N/A";
  const number = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(number)) return String(value);
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(number);
}

export function formatStatus(value: unknown) {
  if (value == null || value === "") return "N/A";
  return String(value)
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function humanizeKey(key: string) {
  const overrides: Record<string, string> = {
    dob: "Date of Birth",
    createdAt: "Created Date",
    updatedAt: "Last Updated",
    className: "Class",
    subjectName: "Subject",
    durationMinutes: "Duration",
    phoneNumber: "Phone Number",
    dueAt: "Due Date",
    readAt: "Read Date",
  };
  if (overrides[key]) return overrides[key];
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function isPrimitive(value: unknown) {
  return value == null || ["string", "number", "boolean"].includes(typeof value);
}

export function shouldHideKey(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized === "id" ||
    normalized.endsWith("id") ||
    normalized === "passwordhash" ||
    normalized === "token"
  );
}

export function inferType(
  key: string,
  value: unknown,
): "text" | "date" | "currency" | "boolean" | "status" | "email" | "phone" | "number" {
  const normalized = key.toLowerCase();
  if (typeof value === "boolean" || normalized.startsWith("is") || normalized.startsWith("has"))
    return "boolean";
  if (normalized.includes("status") || normalized.includes("state")) return "status";
  if (normalized.includes("date") || normalized.endsWith("at") || normalized.includes("time"))
    return "date";
  if (
    normalized.includes("amount") ||
    normalized.includes("price") ||
    normalized.includes("fee") ||
    normalized.includes("payment")
  )
    return "currency";
  if (normalized.includes("email")) return "email";
  if (normalized.includes("phone") || normalized.includes("mobile")) return "phone";
  if (typeof value === "number") return "number";
  return "text";
}
