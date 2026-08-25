import React, { useEffect, useMemo, useState } from "react";
import { Notice, TFile } from "obsidian";
import type { Task } from "../types";
import type { TaskStore } from "../TaskStore";
import { advanceRecurringTask, toggleTask, toggleTaskCascade } from "../TaskToggler";
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

export function matchesSearch(task: Task, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return true;
  return (
    task.text.toLowerCase().includes(trimmed) ||
    task.fileName.toLowerCase().includes(trimmed)
  );
}

// A subtask nested under a matching ancestor should stay visible even if it
// doesn't itself match — and a match buried in a subtask should surface its
// whole ancestor chain — so search matches against the whole subtree at once.
export function subtreeMatchesSearch(
  task: Task,
  query: string,
  childrenByParent: Map<string, Task[]>
): boolean {
  if (matchesSearch(task, query)) return true;
  const children = childrenByParent.get(task.id) ?? [];
  return children.some((c) => subtreeMatchesSearch(c, query, childrenByParent));
}

export function buildChildrenIndex(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    if (t.parentId === null) continue;
    const list = map.get(t.parentId);
    if (list) list.push(t);
    else map.set(t.parentId, [t]);
  }
  for (const list of map.values()) list.sort((a, b) => a.line - b.line);
  return map;
}

export function collectDescendants(taskId: string, childrenByParent: Map<string, Task[]>): Task[] {
  const direct = childrenByParent.get(taskId) ?? [];
  const all: Task[] = [];
  for (const child of direct) {
    all.push(child, ...collectDescendants(child.id, childrenByParent));
  }
  return all;
}

function isEffectivelyComplete(task: Task, justCompletedIds: Set<string>): boolean {
  return task.completed || justCompletedIds.has(task.id);
}

// Walks up from `task`'s parent, auto-completing any ancestor whose direct
// children are now all effectively complete (bidirectional rollup: finishing
// the last subtask finishes the parent, recursively up the chain). Stops at
// a recurring ancestor — a recurring task never reaches a checked state —
// or as soon as an ancestor still has an incomplete child.
export function computeRollupCompletions(
  task: Task,
  justCompletedIds: Set<string>,
  tasksById: Map<string, Task>,
  childrenByParent: Map<string, Task[]>
): string[] {
  const autoCompleted: string[] = [];
  const completed = new Set(justCompletedIds);
  let parentId = task.parentId;

  while (parentId !== null) {
    const parent = tasksById.get(parentId);
    if (!parent) break;
    if (parent.completed || completed.has(parent.id)) break;
    if (parent.repeat && parent.due) break;

    const siblings = childrenByParent.get(parent.id) ?? [];
    if (!siblings.every((s) => isEffectivelyComplete(s, completed))) break;

    completed.add(parent.id);
    autoCompleted.push(parent.id);
    parentId = parent.parentId;
  }

  return autoCompleted;
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
  const [query, setQuery] = useState("");

  useEffect(() => {
    return store.subscribe(() => {
      const newTasks = store.getAllTasks();
      setTasks(newTasks);
      setCompletedTodayIds((prev) => pruneCompletedToday(prev, newTasks));
    });
  }, [store]);

  const childrenByParent = useMemo(() => buildChildrenIndex(tasks), [tasks]);
  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  // Date-based groupings (Completed Today, Overdue/Today/Upcoming) are derived
  // from the current time at render. Without vault activity there's otherwise
  // no re-render to pick up a day boundary being crossed, so tasks can appear
  // stuck in "Completed Today" indefinitely while the app sits idle overnight.
  const [, forceRefresh] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => forceRefresh((n) => n + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  async function advanceRecurring(task: Task, noticePrefix: string): Promise<void> {
    if (!task.repeat || !task.due) return;
    const file = app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) return;

    const nextDue = nextOccurrence(task.due, task.repeat, new Date());
    await advanceRecurringTask(app.vault, file, task.line, nextDue, task.hasTime);
    new Notice(`${noticePrefix} ${formatDue(nextDue, task.hasTime)}`);
  }

  async function handleSkip(task: Task): Promise<void> {
    await advanceRecurring(task, "Skipped to");
  }

  async function handleToggle(task: Task): Promise<void> {
    // Task is "completing" unless it's already marked complete via file or optimistic state
    const completing = !task.completed && !completedTodayIds.has(task.id) && !isCompletedToday(task.completedAt);

    // Recurring tasks roll forward in place instead of reaching a checked state,
    // so they must never be tracked as "completed today".
    if (completing && task.repeat && task.due) {
      await advanceRecurring(task, "Advanced to");
      return;
    }

    const file = app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) return;

    if (completing) {
      // Cascade down to subtasks (skipping recurring ones — they never reach
      // a checked state), then roll up: auto-complete any ancestor whose
      // children are now all complete, recursively.
      const descendants = collectDescendants(task.id, childrenByParent).filter(
        (d) => !(d.repeat && d.due)
      );
      const justCompleted = new Set<string>([task.id, ...descendants.map((d) => d.id)]);
      const autoCompleted = computeRollupCompletions(task, justCompleted, tasksById, childrenByParent);

      setCompletedTodayIds((prev) => {
        const next = new Set(prev);
        for (const id of justCompleted) next.add(id);
        for (const id of autoCompleted) next.add(id);
        return next;
      });

      await toggleTaskCascade(app.vault, file, [task.line, ...descendants.map((d) => d.line)], true);
      if (autoCompleted.length > 0) {
        const ancestorLines = autoCompleted.map((id) => tasksById.get(id)!.line);
        await toggleTaskCascade(app.vault, file, ancestorLines, true);
      }
      return;
    }

    setCompletedTodayIds((prev) => {
      const next = new Set(prev);
      next.delete(task.id);
      return next;
    });

    await toggleTask(app.vault, file, task.line, false);
  }

  const topLevelTasks = tasks.filter((t) => t.parentId === null);
  const visibleTopLevel = topLevelTasks.filter((t) => subtreeMatchesSearch(t, query, childrenByParent));

  // Active = not yet completed in file AND not optimistically completed
  const activeTasks = visibleTopLevel.filter(
    (t) => !t.completed && !completedTodayIds.has(t.id) && !isCompletedToday(t.completedAt)
  );
  // Completed Today = has [done:: today] annotation OR optimistically completed this session
  const completedTodayTasks = visibleTopLevel.filter(
    (t) => isCompletedToday(t.completedAt) || completedTodayIds.has(t.id)
  );
  const allCompletedTasks = visibleTopLevel.filter((t) => t.completed && t.completedAt !== undefined);

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
      <div className="tasks-panel__search">
        <input
          type="search"
          className="tasks-panel__search-input"
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="tasks-panel__body">
        {mode === "grouped" && (
          <GroupedView
            activeTasks={activeTasks}
            completedTodayTasks={completedTodayTasks}
            childrenByParent={childrenByParent}
            onToggle={(t) => void handleToggle(t)}
            onSkip={(t) => void handleSkip(t)}
          />
        )}
        {mode === "flat" && (
          <FlatView
            activeTasks={activeTasks}
            completedTodayTasks={completedTodayTasks}
            childrenByParent={childrenByParent}
            onToggle={(t) => void handleToggle(t)}
            onSkip={(t) => void handleSkip(t)}
          />
        )}
        {mode === "history" && (
          <HistoryView
            completedTasks={allCompletedTasks}
            childrenByParent={childrenByParent}
            onToggle={(t) => void handleToggle(t)}
          />
        )}
      </div>
    </div>
  );
}
