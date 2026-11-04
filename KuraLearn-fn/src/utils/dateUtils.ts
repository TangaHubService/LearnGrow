export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  return new Date(d.setDate(diff));
}

export function getDaysInPeriod(start: Date, days: number): Date[] {
  const arr = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push(d);
  }
  return arr;
}

export function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = start.toLocaleDateString("en-GB", options);
  const endStr = end.toLocaleDateString("en-GB", options);
  const year = start.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startStr} - ${end.getDate()}, ${year}`;
  }
  return `${startStr} - ${endStr}, ${year}`;
}
