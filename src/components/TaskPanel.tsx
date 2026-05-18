import React, { useEffect, useState } from "react";
import { TFile } from "obsidian";
import type { Task } from "../types";
import type { TaskStore } from "../TaskStore";
import { toggleTask } from "../TaskToggler";
import { GroupedView } from "./GroupedView";
import { FlatView } from "./FlatView";
import { useApp } from "./AppContext";

type ViewMode = "grouped" | "flat";

interface Props {
  store: TaskStore;
  onRefresh: () => Promise<void>;
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
      // When editor unchecks a task, remove it from the local completed set
      setCompletedTodayIds((prev) => {
        if (prev.size === 0) return prev;
        const taskById = new Map(newTasks.map((t) => [t.id, t]));
        const next = new Set(prev);
        for (const id of prev) {
          const t = taskById.get(id);
          if (t && !t.completed) next.delete(id);
        }
        return next.size === prev.size ? prev : next;
      });
    });
  }, [store]);

  async function handleToggle(task: Task): Promise<void> {
    // Task is "completing" unless it's already marked complete via file or optimistic state
    const completing = !task.completed && !completedTodayIds.has(task.id) && !isCompletedToday(task.completedAt);
    setCompletedTodayIds((prev) => {
      const next = new Set(prev);
      completing ? next.add(task.id) : next.delete(task.id);
      return next;
    });

    const file = app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) return;
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
          <button className="tasks-panel__refresh" onClick={() => void onRefresh()} title="Refresh">
            ↻
          </button>
        </div>
      </div>
      <div className="tasks-panel__body">
        {mode === "grouped" ? (
          <GroupedView
            activeTasks={activeTasks}
            completedTodayTasks={completedTodayTasks}
            onToggle={(t) => void handleToggle(t)}
          />
        ) : (
          <FlatView
            activeTasks={activeTasks}
            completedTodayTasks={completedTodayTasks}
            onToggle={(t) => void handleToggle(t)}
          />
        )}
      </div>
    </div>
  );
}
