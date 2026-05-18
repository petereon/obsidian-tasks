import { parseTasksFromFile } from "../src/TaskParser";
import type { ListItemCache } from "obsidian";

function makeListItem(line: number, taskChar?: string): ListItemCache {
  return {
    task: taskChar,
    position: {
      start: { line, col: 0, offset: 0 },
      end: { line, col: 50, offset: 50 },
    },
    parent: -1,
  };
}

describe("parseTasksFromFile", () => {
  it("returns empty array when no list items", () => {
    expect(parseTasksFromFile("note.md", "", [])).toEqual([]);
  });

  it("skips non-task list items (no task char)", () => {
    const content = "- plain list item";
    const items = [makeListItem(0)];
    expect(parseTasksFromFile("note.md", content, items)).toHaveLength(0);
  });

  it("parses an incomplete task with no due date", () => {
    const content = "- [ ] Buy groceries";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: "note.md::0",
      text: "Buy groceries",
      due: null,
      hasTime: false,
      completed: false,
      filePath: "note.md",
      fileName: "note",
      line: 0,
    });
  });

  it("parses a completed task", () => {
    const content = "- [x] Done task";
    const items = [makeListItem(0, "x")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].completed).toBe(true);
  });

  it("parses due date only", () => {
    const content = "- [ ] Call dentist [due:: 2025-06-01]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Call dentist");
    expect(tasks[0].due).toEqual(new Date(2025, 5, 1, 0, 0, 0));
    expect(tasks[0].hasTime).toBe(false);
  });

  it("parses due date with time", () => {
    const content = "- [ ] Meeting [due:: 2025-06-01 14:30]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Meeting");
    expect(tasks[0].due).toEqual(new Date(2025, 5, 1, 14, 30, 0));
    expect(tasks[0].hasTime).toBe(true);
  });

  it("strips due syntax from text", () => {
    const content = "- [ ] Buy milk [due:: 2025-01-15] extra text";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Buy milk extra text");
  });

  it("extracts fileName from nested path", () => {
    const content = "- [ ] Task";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("folder/sub/note.md", content, items);
    expect(tasks[0].fileName).toBe("note");
    expect(tasks[0].filePath).toBe("folder/sub/note.md");
  });

  it("handles indented tasks", () => {
    const content = "  - [ ] Indented task";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Indented task");
  });

  it("parses completedAt from done annotation", () => {
    const content = "- [x] Buy milk [done:: 2026-01-15 17:30]";
    const items = [makeListItem(0, "x")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].completedAt).toEqual(new Date(2026, 0, 15, 17, 30, 0));
  });

  it("strips done annotation from display text", () => {
    const content = "- [x] Buy milk [done:: 2026-01-15 17:30]";
    const items = [makeListItem(0, "x")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Buy milk");
  });

  it("strips both due and done annotations from text", () => {
    const content = "- [x] Meeting [due:: 2026-01-15 14:00] [done:: 2026-01-15 14:05]";
    const items = [makeListItem(0, "x")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Meeting");
    expect(tasks[0].due).toEqual(new Date(2026, 0, 15, 14, 0, 0));
    expect(tasks[0].completedAt).toEqual(new Date(2026, 0, 15, 14, 5, 0));
  });

  it("completedAt is undefined when no done annotation", () => {
    const content = "- [ ] Buy groceries";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].completedAt).toBeUndefined();
  });
});
