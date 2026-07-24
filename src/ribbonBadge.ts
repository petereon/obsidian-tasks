import { bucketize } from "./components/GroupedView";
import type { Task } from "./types";

export function countAttentionTasks(tasks: Task[], now: Date): number {
  const { overdue, today } = bucketize(
    tasks.filter((t) => !t.completed),
    now
  );
  return overdue.length + today.length;
}
