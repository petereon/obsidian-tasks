export const DUE_REGEX = /\[due::\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?\]/;
export const DUE_REGEX_GLOBAL = /\s*\[due::\s*\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?\]/g;

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

export function parseDue(text: string): { due: Date | null; hasTime: boolean } {
  const match = text.match(DUE_REGEX);
  if (!match) return { due: null, hasTime: false };

  const [, dateStr, timeStr] = match;
  const [year, month, day] = (dateStr as string).split("-").map(Number);

  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { due: new Date(year, month - 1, day, hours, minutes, 0), hasTime: true };
  }

  return { due: new Date(year, month - 1, day, 0, 0, 0), hasTime: false };
}

export function formatDueAnnotation(date: Date, hasTime: boolean): string {
  const y = date.getFullYear();
  const mo = padTwo(date.getMonth() + 1);
  const d = padTwo(date.getDate());
  let annotation = `[due:: ${y}-${mo}-${d}`;
  if (hasTime) annotation += ` ${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`;
  annotation += "]";
  return annotation;
}
