import React, { useState } from "react";
import type { Task } from "../types";
import { TaskItem } from "./TaskItem";

interface Props {
  activeTasks: Task[];
  completedTodayTasks: Task[];
  onToggle: (task: Task) => void;
}

export interface SectionProps {
  label: string;
  tasks: Task[];
  defaultOpen: boolean;
  completed?: boolean;
  onToggle: (task: Task) => void;
}

export function Section({ label, tasks, defaultOpen, completed = false, onToggle }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="tasks-section">
      <button
        className="tasks-section__header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="tasks-section__arrow">{open ? "▼" : "▶"}</span>
        <span className="tasks-section__label">{label}</span>
        <span className="tasks-section__count">{tasks.length}</span>
      </button>
      {open && (
        <div className="tasks-section__body">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              completed={completed}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function bucketize(tasks: Task[], now: Date): {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  noDate: Task[];
} {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);

  const overdue: Task[] = [];
  const today: Task[] = [];
  const upcoming: Task[] = [];
  const noDate: Task[] = [];

  for (const task of tasks) {
    if (!task.due) {
      noDate.push(task);
    } else if (task.due < todayStart) {
      overdue.push(task);
    } else if (task.due < tomorrowStart) {
      today.push(task);
    } else {
      upcoming.push(task);
    }
  }

  const byDue = (a: Task, b: Task) =>
    (a.due?.getTime() ?? 0) - (b.due?.getTime() ?? 0);
  overdue.sort(byDue);
  today.sort(byDue);
  upcoming.sort(byDue);

  return { overdue, today, upcoming, noDate };
}

export function GroupedView({ activeTasks, completedTodayTasks, onToggle }: Props) {
  const { overdue, today, upcoming, noDate } = bucketize(activeTasks, new Date());

  return (
    <div className="tasks-grouped">
      {overdue.length > 0 && (
        <Section label="OVERDUE" tasks={overdue} defaultOpen={true} onToggle={onToggle} />
      )}
      {today.length > 0 && (
        <Section label="TODAY" tasks={today} defaultOpen={true} onToggle={onToggle} />
      )}
      {upcoming.length > 0 && (
        <Section label="UPCOMING" tasks={upcoming} defaultOpen={false} onToggle={onToggle} />
      )}
      {noDate.length > 0 && (
        <Section label="NO DATE" tasks={noDate} defaultOpen={false} onToggle={onToggle} />
      )}
      {completedTodayTasks.length > 0 && (
        <Section
          label="COMPLETED TODAY"
          tasks={completedTodayTasks}
          defaultOpen={false}
          completed={true}
          onToggle={onToggle}
        />
      )}
    </div>
  );
}
