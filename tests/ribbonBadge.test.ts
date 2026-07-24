import { countAttentionTasks } from "../src/ribbonBadge";
import type { Task } from "../src/types";

const NOW = new Date(2026, 5, 15, 12, 0, 0);

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
    ...overrides,
  };
}

describe("countAttentionTasks", () => {
  it("returns zero when nothing is overdue or due today", () => {
    const upcoming = makeTask({ due: new Date(2026, 5, 20, 0, 0, 0) });
    const noDate = makeTask({ id: "b.md::0", due: null });
    expect(countAttentionTasks([upcoming, noDate], NOW)).toBe(0);
  });

  it("counts overdue tasks", () => {
    const overdue = makeTask({ due: new Date(2026, 5, 10, 0, 0, 0) });
    expect(countAttentionTasks([overdue], NOW)).toBe(1);
  });

  it("counts due-today tasks", () => {
    const dueToday = makeTask({ due: new Date(2026, 5, 15, 18, 0, 0) });
    expect(countAttentionTasks([dueToday], NOW)).toBe(1);
  });

  it("excludes completed tasks even if their due date is overdue", () => {
    const completedOverdue = makeTask({
      due: new Date(2026, 5, 10, 0, 0, 0),
      completed: true,
      completedAt: new Date(2026, 5, 10, 9, 0, 0),
    });
    expect(countAttentionTasks([completedOverdue], NOW)).toBe(0);
  });

  it("excludes upcoming and no-date tasks", () => {
    const upcoming = makeTask({ due: new Date(2026, 5, 20, 0, 0, 0) });
    const noDate = makeTask({ id: "b.md::0", due: null });
    const overdue = makeTask({ id: "c.md::0", due: new Date(2026, 5, 10, 0, 0, 0) });
    expect(countAttentionTasks([upcoming, noDate, overdue], NOW)).toBe(1);
  });

  it("combines overdue and due-today counts", () => {
    const overdue = makeTask({ due: new Date(2026, 5, 10, 0, 0, 0) });
    const dueToday = makeTask({ id: "b.md::0", due: new Date(2026, 5, 15, 9, 0, 0) });
    expect(countAttentionTasks([overdue, dueToday], NOW)).toBe(2);
  });
});
