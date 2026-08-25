import { sortTasks } from "../src/sortTasks";
import type { Task } from "../src/types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "a.md::0",
    text: "Task",
    due: null,
    hasTime: false,
    completed: false,
    completedAt: undefined,
    filePath: "a.md",
    fileName: "a",
    line: 0,
    repeat: null,
    parentId: null,
    priority: null,
    ...overrides,
  };
}

describe("sortTasks — by due date", () => {
  it("ascending: earliest due date first", () => {
    const late = makeTask({ id: "late", due: new Date(2026, 5, 10) });
    const early = makeTask({ id: "early", due: new Date(2026, 5, 1) });
    const result = sortTasks([late, early], "due", "asc");
    expect(result.map((t) => t.id)).toEqual(["early", "late"]);
  });

  it("descending: latest due date first", () => {
    const late = makeTask({ id: "late", due: new Date(2026, 5, 10) });
    const early = makeTask({ id: "early", due: new Date(2026, 5, 1) });
    const result = sortTasks([early, late], "due", "desc");
    expect(result.map((t) => t.id)).toEqual(["late", "early"]);
  });

  it("ascending: no-date tasks sort last", () => {
    const dated = makeTask({ id: "dated", due: new Date(2026, 5, 1) });
    const noDate = makeTask({ id: "noDate", due: null });
    const result = sortTasks([noDate, dated], "due", "asc");
    expect(result.map((t) => t.id)).toEqual(["dated", "noDate"]);
  });
});

describe("sortTasks — by priority", () => {
  it("ascending: low priority (and none) before high", () => {
    const high = makeTask({ id: "high", priority: "high" });
    const low = makeTask({ id: "low", priority: "low" });
    const none = makeTask({ id: "none", priority: null });
    const result = sortTasks([high, low, none], "priority", "asc");
    expect(result.map((t) => t.id)).toEqual(["none", "low", "high"]);
  });

  it("descending: high priority first", () => {
    const high = makeTask({ id: "high", priority: "high" });
    const medium = makeTask({ id: "medium", priority: "medium" });
    const low = makeTask({ id: "low", priority: "low" });
    const result = sortTasks([low, medium, high], "priority", "desc");
    expect(result.map((t) => t.id)).toEqual(["high", "medium", "low"]);
  });
});

describe("sortTasks", () => {
  it("does not mutate the input array", () => {
    const tasks = [makeTask({ id: "b", due: new Date(2026, 5, 10) }), makeTask({ id: "a", due: new Date(2026, 5, 1) })];
    const original = [...tasks];
    sortTasks(tasks, "due", "asc");
    expect(tasks).toEqual(original);
  });
});
