import type { Task } from "./types";

export class TaskStore {
  private fileMap = new Map<string, Task[]>();
  private listeners: Array<() => void> = [];

  updateFile(filePath: string, tasks: Task[]): void {
    this.fileMap.set(filePath, tasks);
    this.notify();
  }

  removeFile(filePath: string): void {
    if (this.fileMap.delete(filePath)) {
      this.notify();
    }
  }

  getFileTasks(filePath: string): Task[] {
    return this.fileMap.get(filePath) ?? [];
  }

  getAllTasks(): Task[] {
    const all: Task[] = [];
    for (const tasks of this.fileMap.values()) {
      all.push(...tasks);
    }
    return all;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }
}
