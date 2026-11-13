import React from "react";
import type { Task } from "../types";
import { Section } from "./GroupedView";

interface Props {
  activeTasks: Task[];
  completedTodayTasks: Task[];
  childrenByParent: Map<string, Task[]>;
  onToggle: (task: Task) => void;
  onSkip: (task: Task) => void;
}

// One group per "note › heading" (just "note" when there's no heading above the task).
export function groupByHeading(tasks: Task[]): Array<{ label: string; tasks: Task[] }> {
  const groups = new Map<string, Task[]>();
  for (const t of tasks) {
    const label = t.heading ? `${t.fileName} › ${t.heading}` : t.fileName;
    const list = groups.get(label);
    if (list) list.push(t);
    else groups.set(label, [t]);
  }
  return Array.from(groups, ([label, list]) => ({
    label,
    tasks: list.sort((a, b) => a.line - b.line),
  })).sort((a, b) => a.label.localeCompare(b.label));
}

export function HeadingView({ activeTasks, completedTodayTasks, childrenByParent, onToggle, onSkip }: Props) {
  return (
    <div className="tasks-headings">
      {groupByHeading(activeTasks).map((g) => (
        <Section
          key={g.label}
          label={g.label}
          tasks={g.tasks}
          defaultOpen={true}
          childrenByParent={childrenByParent}
          onToggle={onToggle}
          onSkip={onSkip}
        />
      ))}
      {completedTodayTasks.length > 0 && (
        <Section
          label="COMPLETED TODAY"
          tasks={completedTodayTasks}
          defaultOpen={true}
          completed={true}
          childrenByParent={childrenByParent}
          onToggle={onToggle}
        />
      )}
    </div>
  );
}
