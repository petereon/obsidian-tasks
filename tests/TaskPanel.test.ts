import {
  buildChildrenIndex,
  collectDescendants,
  computeRollupCompletions,
  matchesSearch,
  pruneCompletedToday,
  subtreeMatchesSearch,
} from "../src/components/TaskPanel";
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
    repeat: null,
    parentId: null,
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

describe("matchesSearch", () => {
  it("matches everything when the query is empty", () => {
    const task = makeTask({ text: "Buy milk", fileName: "shopping" });
    expect(matchesSearch(task, "")).toBe(true);
  });

  it("matches everything when the query is whitespace only", () => {
    const task = makeTask({ text: "Buy milk", fileName: "shopping" });
    expect(matchesSearch(task, "   ")).toBe(true);
  });

  it("matches on task text, case-insensitively", () => {
    const task = makeTask({ text: "Buy Milk", fileName: "shopping" });
    expect(matchesSearch(task, "milk")).toBe(true);
  });

  it("matches on filename, case-insensitively", () => {
    const task = makeTask({ text: "Buy milk", fileName: "Shopping" });
    expect(matchesSearch(task, "shop")).toBe(true);
  });

  it("matches a partial substring mid-word", () => {
    const task = makeTask({ text: "Reorganize garage", fileName: "chores" });
    expect(matchesSearch(task, "organ")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    const task = makeTask({ text: "Buy milk", fileName: "shopping" });
    expect(matchesSearch(task, "dentist")).toBe(false);
  });
});

describe("buildChildrenIndex", () => {
  it("groups tasks by parentId, sorted by line", () => {
    const parent = makeTask({ id: "a.md::0", line: 0 });
    const childB = makeTask({ id: "a.md::2", line: 2, parentId: "a.md::0" });
    const childA = makeTask({ id: "a.md::1", line: 1, parentId: "a.md::0" });
    const index = buildChildrenIndex([parent, childB, childA]);
    expect(index.get("a.md::0")).toEqual([childA, childB]);
  });

  it("omits top-level tasks (parentId null) from the index", () => {
    const index = buildChildrenIndex([makeTask({ id: "a.md::0", parentId: null })]);
    expect(index.size).toBe(0);
  });
});

describe("collectDescendants", () => {
  it("returns direct and nested descendants in document order", () => {
    const grandchild = makeTask({ id: "a.md::2", line: 2, parentId: "a.md::1" });
    const child = makeTask({ id: "a.md::1", line: 1, parentId: "a.md::0" });
    const index = buildChildrenIndex([child, grandchild]);
    expect(collectDescendants("a.md::0", index)).toEqual([child, grandchild]);
  });

  it("returns an empty array for a task with no children", () => {
    expect(collectDescendants("a.md::0", new Map())).toEqual([]);
  });
});

describe("subtreeMatchesSearch", () => {
  it("matches when the task itself matches", () => {
    const task = makeTask({ text: "Buy milk" });
    expect(subtreeMatchesSearch(task, "milk", new Map())).toBe(true);
  });

  it("matches when a descendant matches, even if the task itself doesn't", () => {
    const parent = makeTask({ id: "a.md::0", text: "Plan trip" });
    const child = makeTask({ id: "a.md::1", text: "Book flight", parentId: "a.md::0" });
    const index = buildChildrenIndex([child]);
    expect(subtreeMatchesSearch(parent, "flight", index)).toBe(true);
  });

  it("returns false when neither the task nor any descendant matches", () => {
    const parent = makeTask({ id: "a.md::0", text: "Plan trip" });
    const child = makeTask({ id: "a.md::1", text: "Book flight", parentId: "a.md::0" });
    const index = buildChildrenIndex([child]);
    expect(subtreeMatchesSearch(parent, "dentist", index)).toBe(false);
  });
});

describe("computeRollupCompletions", () => {
  it("auto-completes the parent when the last remaining child is completed", () => {
    const parent = makeTask({ id: "a.md::0", completed: false, parentId: null });
    const doneChild = makeTask({ id: "a.md::1", completed: true, parentId: "a.md::0" });
    const finishingChild = makeTask({ id: "a.md::2", completed: false, parentId: "a.md::0" });
    const tasksById = new Map([
      [parent.id, parent],
      [doneChild.id, doneChild],
      [finishingChild.id, finishingChild],
    ]);
    const index = buildChildrenIndex([doneChild, finishingChild]);

    const result = computeRollupCompletions(
      finishingChild,
      new Set([finishingChild.id]),
      tasksById,
      index
    );
    expect(result).toEqual(["a.md::0"]);
  });

  it("does not complete the parent while a sibling is still incomplete", () => {
    const parent = makeTask({ id: "a.md::0", completed: false, parentId: null });
    const finishingChild = makeTask({ id: "a.md::1", completed: false, parentId: "a.md::0" });
    const pendingChild = makeTask({ id: "a.md::2", completed: false, parentId: "a.md::0" });
    const tasksById = new Map([
      [parent.id, parent],
      [finishingChild.id, finishingChild],
      [pendingChild.id, pendingChild],
    ]);
    const index = buildChildrenIndex([finishingChild, pendingChild]);

    const result = computeRollupCompletions(
      finishingChild,
      new Set([finishingChild.id]),
      tasksById,
      index
    );
    expect(result).toEqual([]);
  });

  it("cascades upward through multiple levels", () => {
    const grandparent = makeTask({ id: "a.md::0", completed: false, parentId: null });
    const parent = makeTask({ id: "a.md::1", completed: false, parentId: "a.md::0" });
    const child = makeTask({ id: "a.md::2", completed: false, parentId: "a.md::1" });
    const tasksById = new Map([
      [grandparent.id, grandparent],
      [parent.id, parent],
      [child.id, child],
    ]);
    const index = buildChildrenIndex([parent, child]);

    const result = computeRollupCompletions(child, new Set([child.id]), tasksById, index);
    expect(result).toEqual(["a.md::1", "a.md::0"]);
  });

  it("does not auto-complete a recurring parent", () => {
    const parent = makeTask({
      id: "a.md::0",
      completed: false,
      parentId: null,
      repeat: { count: 1, unit: "week" },
      due: new Date(2026, 0, 1),
    });
    const child = makeTask({ id: "a.md::1", completed: false, parentId: "a.md::0" });
    const tasksById = new Map([
      [parent.id, parent],
      [child.id, child],
    ]);
    const index = buildChildrenIndex([child]);

    const result = computeRollupCompletions(child, new Set([child.id]), tasksById, index);
    expect(result).toEqual([]);
  });

  it("returns an empty array for a top-level task with no parent", () => {
    const task = makeTask({ id: "a.md::0", parentId: null });
    const result = computeRollupCompletions(task, new Set([task.id]), new Map(), new Map());
    expect(result).toEqual([]);
  });
});
