/** Turns stored values such as HEAD_TEACHER or AttendanceRecord into readable words. */
export function readable(value: string | null | undefined) {
  if (!value) return "Unknown";
  const words = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export const ROLE_OPTIONS = [
  "STUDENT",
  "PARENT",
  "TEACHER",
  "DIRECTOR_OF_STUDIES",
  "HEAD_TEACHER",
  "ADMIN",
  "SUPER_ADMIN",
];
export const USER_STATUS_OPTIONS = ["ACTIVE", "PENDING", "SUSPENDED"];
export const SUBSCRIPTION_OPTIONS = ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED"];
