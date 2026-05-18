export function formatDue(
  due: Date | null,
  hasTime: boolean,
  now: Date = new Date()
): string {
  if (!due) return "";

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffMs = dueStart.getTime() - todayStart.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const timeSuffix = hasTime
    ? ` ${String(due.getHours()).padStart(2, "0")}:${String(due.getMinutes()).padStart(2, "0")}`
    : "";

  if (diffDays === 0) return `today${timeSuffix}`;
  if (diffDays === -1) return `yesterday${timeSuffix}`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  if (diffDays === 1) return `tomorrow${timeSuffix}`;

  const month = due.toLocaleString("en-US", { month: "short" });
  return `${month} ${due.getDate()}${timeSuffix}`;
}
