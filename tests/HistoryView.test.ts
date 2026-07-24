import { bucketCompletedHistory, formatHistoryDateHeader } from "../src/components/HistoryView";
import type { Task } from "../src/types";

const NOW = new Date(2026, 5, 15, 12, 0, 0);

function makeTask(id: string, completedAt: Date): Task {
  return {
    id,
    text: "Task " + id,
    due: null,
    hasTime: false,
    completed: true,
    completedAt,
    filePath: "a.md",
    fileName: "a",
    line: 0,
    repeat: null,
  };
}

describe("formatHistoryDateHeader", () => {
  it("labels today", () => {
    expect(formatHistoryDateHeader(new Date(2026, 5, 15, 9, 0, 0), NOW)).toBe("Today");
  });

  it("labels yesterday", () => {
    expect(formatHistoryDateHeader(new Date(2026, 5, 14, 9, 0, 0), NOW)).toBe("Yesterday");
  });

  it("labels an older date in the current year without the year", () => {
    expect(formatHistoryDateHeader(new Date(2026, 0, 5, 9, 0, 0), NOW)).toBe("Jan 5");
  });

  it("labels a date in a different year with the year included", () => {
    expect(formatHistoryDateHeader(new Date(2024, 11, 25, 9, 0, 0), NOW)).toBe("Dec 25, 2024");
  });
});

describe("bucketCompletedHistory", () => {
  it("returns an empty array for no tasks", () => {
    expect(bucketCompletedHistory([], NOW)).toEqual([]);
  });

  it("groups tasks completed on the same day into one bucket", () => {
    const a = makeTask("a", new Date(2026, 5, 15, 9, 0, 0));
    const b = makeTask("b", new Date(2026, 5, 15, 14, 0, 0));
    const groups = bucketCompletedHistory([a, b], NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Today");
    expect(groups[0].tasks.map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("orders tasks within a day by completedAt descending", () => {
    const early = makeTask("early", new Date(2026, 5, 15, 8, 0, 0));
    const late = makeTask("late", new Date(2026, 5, 15, 20, 0, 0));
    const groups = bucketCompletedHistory([early, late], NOW);
    expect(groups[0].tasks.map((t) => t.id)).toEqual(["late", "early"]);
  });

  it("orders day groups newest first", () => {
    const today = makeTask("today", new Date(2026, 5, 15, 9, 0, 0));
    const yesterday = makeTask("yesterday", new Date(2026, 5, 14, 9, 0, 0));
    const older = makeTask("older", new Date(2026, 0, 5, 9, 0, 0));
    const groups = bucketCompletedHistory([older, today, yesterday], NOW);
    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday", "Jan 5"]);
  });

  it("produces no group for a day with no completions", () => {
    const today = makeTask("today", new Date(2026, 5, 15, 9, 0, 0));
    const groups = bucketCompletedHistory([today], NOW);
    expect(groups.map((g) => g.label)).toEqual(["Today"]);
  });
});
