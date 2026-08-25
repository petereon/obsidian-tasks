import type { Priority } from "./priority";
import type { Task } from "./types";

export type SortField = "due" | "priority";
export type SortDirection = "asc" | "desc";

const PRIORITY_RANK: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

function priorityRank(priority: Priority | null): number {
  return priority ? PRIORITY_RANK[priority] : 0;
}

// Ascending order per field: earliest due first (no date last), lowest
// priority first (no priority lowest). Direction is applied afterwards by
// reversing, so "desc" is always the exact mirror of "asc" for a field.
function compareAscending(a: Task, b: Task, field: SortField): number {
  if (field === "priority") {
    return priorityRank(a.priority) - priorityRank(b.priority);
  }
  if (!a.due && !b.due) return 0;
  if (!a.due) return 1;
  if (!b.due) return -1;
  return a.due.getTime() - b.due.getTime();
}

export function sortTasks(tasks: Task[], field: SortField, direction: SortDirection): Task[] {
  const sorted = [...tasks].sort((a, b) => compareAscending(a, b, field));
  if (direction === "desc") sorted.reverse();
  return sorted;
}
