import { pruneCompletedToday } from "../src/components/TaskPanel";
import type { Task } from "../src/types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "a.md::0",
    text: "Task",
    due: null,
    hasTime: false,
    completed: true,
    completedAt: undefined,
    filePath: "a.md",
    fileName: "a",
    line: 0,
    ...overrides,
  };
}

describe("pruneCompletedToday", () => {
  it("keeps an id while the task is completed but not yet file-confirmed", () => {
    const tasks = [makeTask({ completed: true, completedAt: undefined })];
    const result = pruneCompletedToday(new Set(["a.md::0"]), tasks);
    expect(result.has("a.md::0")).toBe(true);
  });

  it("drops an id once the task's completedAt is confirmed by the file", () => {
    // This is the optimistic-tracking bug: once real completedAt data arrives,
    // the id must be released so the date-based check takes over. Otherwise it
    // stays flagged "completed today" forever, even after the day rolls over.
    const tasks = [makeTask({ completed: true, completedAt: new Date(2020, 0, 1) })];
    const result = pruneCompletedToday(new Set(["a.md::0"]), tasks);
    expect(result.has("a.md::0")).toBe(false);
  });

  it("drops an id when the task is unchecked", () => {
    const tasks = [makeTask({ completed: false, completedAt: undefined })];
    const result = pruneCompletedToday(new Set(["a.md::0"]), tasks);
    expect(result.has("a.md::0")).toBe(false);
  });

  it("drops an id when the task no longer exists", () => {
    const result = pruneCompletedToday(new Set(["a.md::0"]), []);
    expect(result.has("a.md::0")).toBe(false);
  });

  it("returns the same set instance when nothing changes", () => {
    const tasks = [makeTask({ completed: true, completedAt: undefined })];
    const input = new Set(["a.md::0"]);
    expect(pruneCompletedToday(input, tasks)).toBe(input);
  });
});
