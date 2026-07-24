import React from "react";
import type { Task } from "../types";
import { Section } from "./GroupedView";

interface Props {
  completedTasks: Task[];
  onToggle: (task: Task) => void;
}

export function formatHistoryDateHeader(date: Date, now: Date): string {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((dateStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";

  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  if (date.getFullYear() !== now.getFullYear()) {
    return `${month} ${day}, ${date.getFullYear()}`;
  }
  return `${month} ${day}`;
}

export function bucketCompletedHistory(
  tasks: Task[],
  now: Date
): Array<{ label: string; tasks: Task[] }> {
  const byDayKey = new Map<string, Task[]>();

  for (const task of tasks) {
    const completedAt = task.completedAt as Date;
    const key = `${completedAt.getFullYear()}-${completedAt.getMonth()}-${completedAt.getDate()}`;
    const existing = byDayKey.get(key);
    if (existing) {
      existing.push(task);
    } else {
      byDayKey.set(key, [task]);
    }
  }

  const groups = Array.from(byDayKey.values()).map((dayTasks) => {
    const sorted = [...dayTasks].sort(
      (a, b) => (b.completedAt as Date).getTime() - (a.completedAt as Date).getTime()
    );
    return {
      label: formatHistoryDateHeader(sorted[0].completedAt as Date, now),
      tasks: sorted,
      sortKey: (sorted[0].completedAt as Date).getTime(),
    };
  });

  groups.sort((a, b) => b.sortKey - a.sortKey);

  return groups.map(({ label, tasks: dayTasks }) => ({ label, tasks: dayTasks }));
}

export function HistoryView({ completedTasks, onToggle }: Props) {
  const groups = bucketCompletedHistory(completedTasks, new Date());

  return (
    <div className="tasks-history">
      {groups.map((group, index) => (
        <Section
          key={group.label + index}
          label={group.label}
          tasks={group.tasks}
          defaultOpen={index === 0}
          completed={true}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
