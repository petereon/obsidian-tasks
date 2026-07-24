import React, { useEffect, useState } from "react";
import { Notice, TFile } from "obsidian";
import type { Task } from "../types";
import type { TaskStore } from "../TaskStore";
import { advanceRecurringTask, toggleTask } from "../TaskToggler";
import { nextOccurrence } from "../Recurrence";
import { formatDue } from "../formatDue";
import { GroupedView } from "./GroupedView";
import { FlatView } from "./FlatView";
import { HistoryView } from "./HistoryView";
import { useApp } from "./AppContext";

type ViewMode = "grouped" | "flat" | "history";

interface Props {
  store: TaskStore;
  onRefresh: () => Promise<void>;
}

// A task's id is added here optimistically the moment it's checked off in the
// panel, before the file write + reparse round-trip lands a real `completedAt`.
// Once that real data arrives (or the task is unchecked / disappears), the id
// must be released — otherwise it stays flagged "completed today" forever,
// since it force-includes the task in completedTodayTasks regardless of date.
export function pruneCompletedToday(ids: Set<string>, tasks: Task[]): Set<string> {
  if (ids.size === 0) return ids;
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const next = new Set(ids);
  for (const id of ids) {
    const t = taskById.get(id);
    if (!t || !t.completed || t.completedAt !== undefined) {
      next.delete(id);
    }
  }
  return next.size === ids.size ? ids : next;
}

function isCompletedToday(date: Date | undefined): boolean {
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function TaskPanel({ store, onRefresh }: Props) {
  const app = useApp();
  const [tasks, setTasks] = useState<Task[]>(() => store.getAllTasks());
  const [mode, setMode] = useState<ViewMode>("grouped");
  const [completedTodayIds, setCompletedTodayIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    return store.subscribe(() => {
      const newTasks = store.getAllTasks();
      setTasks(newTasks);
      setCompletedTodayIds((prev) => pruneCompletedToday(prev, newTasks));
    });
  }, [store]);

  // Date-based groupings (Completed Today, Overdue/Today/Upcoming) are derived
  // from the current time at render. Without vault activity there's otherwise
  // no re-render to pick up a day boundary being crossed, so tasks can appear
  // stuck in "Completed Today" indefinitely while the app sits idle overnight.
  const [, forceRefresh] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => forceRefresh((n) => n + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  async function handleToggle(task: Task): Promise<void> {
    // Task is "completing" unless it's already marked complete via file or optimistic state
    const completing = !task.completed && !completedTodayIds.has(task.id) && !isCompletedToday(task.completedAt);

    const file = app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) return;

    // Recurring tasks roll forward in place instead of reaching a checked state,
    // so they must never be tracked as "completed today".
    if (completing && task.repeat && task.due) {
      const nextDue = nextOccurrence(task.due, task.repeat, new Date());
      await advanceRecurringTask(app.vault, file, task.line, nextDue, task.hasTime);
      new Notice(`Advanced to ${formatDue(nextDue, task.hasTime)}`);
      return;
    }

    setCompletedTodayIds((prev) => {
      const next = new Set(prev);
      completing ? next.add(task.id) : next.delete(task.id);
      return next;
    });

    await toggleTask(app.vault, file, task.line, completing);
  }

  // Active = not yet completed in file AND not optimistically completed
  const activeTasks = tasks.filter(
    (t) => !t.completed && !completedTodayIds.has(t.id) && !isCompletedToday(t.completedAt)
  );
  // Completed Today = has [done:: today] annotation OR optimistically completed this session
  const completedTodayTasks = tasks.filter(
    (t) => isCompletedToday(t.completedAt) || completedTodayIds.has(t.id)
  );
  const allCompletedTasks = tasks.filter((t) => t.completed && t.completedAt !== undefined);

  return (
    <div className="tasks-panel">
      <div className="tasks-panel__header">
        <span className="tasks-panel__title">Tasks</span>
        <div className="tasks-panel__controls">
          <button
            className={`tasks-panel__tab${mode === "grouped" ? " tasks-panel__tab--active" : ""}`}
            onClick={() => setMode("grouped")}
          >
            Grouped
          </button>
          <button
            className={`tasks-panel__tab${mode === "flat" ? " tasks-panel__tab--active" : ""}`}
            onClick={() => setMode("flat")}
          >
            Flat
          </button>
          <button
            className={`tasks-panel__tab${mode === "history" ? " tasks-panel__tab--active" : ""}`}
            onClick={() => setMode("history")}
          >
            History
          </button>
          <button className="tasks-panel__refresh" onClick={() => void onRefresh()} title="Refresh">
            ↻
          </button>
        </div>
      </div>
      <div className="tasks-panel__body">
        {mode === "grouped" && (
          <GroupedView
            activeTasks={activeTasks}
            completedTodayTasks={completedTodayTasks}
            onToggle={(t) => void handleToggle(t)}
          />
        )}
        {mode === "flat" && (
          <FlatView
            activeTasks={activeTasks}
            completedTodayTasks={completedTodayTasks}
            onToggle={(t) => void handleToggle(t)}
          />
        )}
        {mode === "history" && (
          <HistoryView completedTasks={allCompletedTasks} onToggle={(t) => void handleToggle(t)} />
        )}
      </div>
    </div>
  );
}
