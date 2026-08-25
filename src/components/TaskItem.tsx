import React from "react";
import { TFile } from "obsidian";
import type { Task } from "../types";
import { formatDue } from "../formatDue";
import { setDueDate } from "../TaskToggler";
import { DueDateModal } from "../modals/DueDateModal";
import { useApp } from "./AppContext";

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

interface Props {
  task: Task;
  completed?: boolean;
  onToggle: (task: Task) => void;
  onSkip?: (task: Task) => void;
  /** Nesting depth for a subtask; 0 for a top-level task. */
  indent?: number;
}

export function TaskItem({ task, completed = false, onToggle, onSkip, indent = 0 }: Props) {
  const app = useApp();

  function openFile(e: React.MouseEvent) {
    e.preventDefault();
    const file = app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) return;
    const leaf = app.workspace.getLeaf(false);
    void leaf.openFile(file, { eState: { line: task.line } });
  }

  function openDueDateEditor(e: React.MouseEvent) {
    e.preventDefault();
    const file = app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) return;

    new DueDateModal(app, task.due, task.hasTime, (date, hasTime) => {
      void setDueDate(app.vault, file, task.line, date, hasTime);
    }).open();
  }

  const dueLabel = formatDue(task.due, task.hasTime);
  const doneLabel = task.completedAt
    ? `done ${String(task.completedAt.getHours()).padStart(2, "0")}:${String(task.completedAt.getMinutes()).padStart(2, "0")}`
    : null;

  const style =
    indent > 0 ? ({ "--tasks-indent": `${indent * 18}px` } as React.CSSProperties) : undefined;

  return (
    <div className={`tasks-item${completed ? " tasks-item--completed" : ""}`} style={style}>
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
        {task.repeat && (
          <span className="tasks-item__repeat" title="Recurring task">
            <RepeatIcon />
          </span>
        )}
        {task.repeat && task.due && !completed && onSkip && (
          <span
            className="tasks-item__skip"
            onClick={(e) => {
              e.preventDefault();
              onSkip(task);
            }}
            role="button"
            tabIndex={0}
            title="Skip to next occurrence"
          >
            <SkipIcon />
          </span>
        )}
        {doneLabel && <span className="tasks-item__done">{doneLabel}</span>}
        {!doneLabel && dueLabel && (
          <span
            className="tasks-item__due"
            onClick={openDueDateEditor}
            role="button"
            tabIndex={0}
            title="Edit due date"
          >
            {dueLabel}
          </span>
        )}
      </span>
      <span
        className="tasks-item__file"
        onClick={openFile}
        role="button"
        tabIndex={0}
        title={task.fileName}
      >
        <LinkIcon />
        <span className="tasks-item__file-name">{task.fileName}</span>
      </span>
    </div>
  );
}
