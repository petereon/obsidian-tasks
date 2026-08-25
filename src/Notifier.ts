import { type App, Notice, TFile } from "obsidian";
import type { Task } from "./types";

const SNOOZE_OPTIONS: { label: string; minutes: number }[] = [
  { label: "Snooze 10m", minutes: 10 },
  { label: "Snooze 1h", minutes: 60 },
];

export class Notifier {
  private notified = new Set<string>();
  private lastDue = new Map<string, number>();
  private snoozedUntil = new Map<string, number>();
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  check(tasks: Task[], thresholdMinutes: number): void {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + thresholdMinutes * 60_000);

    for (const task of tasks) {
      if (!task.hasTime || task.completed || !task.due) continue;

      const currDue = task.due.getTime();
      if (this.lastDue.get(task.id) !== currDue) {
        this.notified.delete(task.id);
        this.snoozedUntil.delete(task.id);
        this.lastDue.set(task.id, currDue);
      }

      // A snoozed task re-fires exactly once when its snooze expires,
      // regardless of the due-soon window (it may already be overdue by then).
      const snoozedUntil = this.snoozedUntil.get(task.id);
      if (snoozedUntil !== undefined) {
        if (now.getTime() < snoozedUntil) continue;
        this.snoozedUntil.delete(task.id);
        this.fire(task, now);
        continue;
      }

      if (task.due <= now || task.due > windowEnd) continue;
      if (this.notified.has(task.id)) continue;

      this.notified.add(task.id);
      this.fire(task, now);
    }
  }

  private snooze(taskId: string, minutes: number): void {
    this.snoozedUntil.set(taskId, Date.now() + minutes * 60_000);
  }

  private navigate(task: Task): void {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) return;
    const leaf = this.app.workspace.getLeaf(false);
    void leaf.openFile(file, { eState: { line: task.line } });
  }

  private fire(task: Task, now: Date): void {
    const minutesLeft = Math.round((task.due!.getTime() - now.getTime()) / 60_000);
    const title = minutesLeft <= 1 ? "Task due now" : `Due in ${minutesLeft} min`;
    const body = `${task.text} · ${task.fileName}`;

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const n = new Notification(title, { body });
      n.onclick = () => {
        window.focus();
        this.navigate(task);
      };
    }

    const notice = new Notice(`${title} — ${body}`, 8000);
    notice.noticeEl.style.cursor = "pointer";
    notice.noticeEl.addEventListener("click", () => {
      this.navigate(task);
      notice.hide();
    });

    const row = document.createElement("div");
    row.className = "tasks-notifier-snooze-row";
    for (const { label, minutes } of SNOOZE_OPTIONS) {
      const btn = document.createElement("button");
      btn.className = "tasks-notifier-snooze-btn";
      btn.textContent = label;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.snooze(task.id, minutes);
        notice.hide();
      });
      row.appendChild(btn);
    }
    notice.noticeEl.appendChild(row);
  }
}
