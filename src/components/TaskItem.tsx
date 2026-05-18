import React from "react";
import { TFile } from "obsidian";
import type { Task } from "../types";
import { formatDue } from "../formatDue";
import { useApp } from "./AppContext";

interface Props {
  task: Task;
  completed?: boolean;
  onToggle: (task: Task) => void;
}

export function TaskItem({ task, completed = false, onToggle }: Props) {
  const app = useApp();

  function openFile(e: React.MouseEvent) {
    e.preventDefault();
    const file = app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) return;
    const leaf = app.workspace.getLeaf(false);
    void leaf.openFile(file, { eState: { line: task.line } });
  }

  const dueLabel = formatDue(task.due, task.hasTime);
  const doneLabel = task.completedAt
    ? `done ${String(task.completedAt.getHours()).padStart(2, "0")}:${String(task.completedAt.getMinutes()).padStart(2, "0")}`
    : null;

  return (
    <div className={`tasks-item${completed ? " tasks-item--completed" : ""}`}>
      <input
        type="checkbox"
        className="tasks-item__checkbox"
        checked={completed}
        onChange={() => onToggle(task)}
      />
      <span className="tasks-item__text" onClick={openFile} role="button" tabIndex={0}>
        {task.text}
      </span>
      <span className="tasks-item__meta">
        {doneLabel && <span className="tasks-item__done">{doneLabel}</span>}
        {!doneLabel && dueLabel && <span className="tasks-item__due">{dueLabel}</span>}
        <span className="tasks-item__file" onClick={openFile} role="button" tabIndex={0}>
          {task.fileName}
        </span>
      </span>
    </div>
  );
}
