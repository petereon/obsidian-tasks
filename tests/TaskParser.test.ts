import { parseTasksFromFile, shouldExcludeFile } from "../src/TaskParser";
import type { ListItemCache } from "obsidian";

function makeListItem(line: number, taskChar?: string, parent = -1): ListItemCache {
  return {
    task: taskChar,
    position: {
      start: { line, col: 0, offset: 0 },
      end: { line, col: 50, offset: 50 },
    },
    parent,
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

  it("excludes a task marked [tasks-no-collect:: true]", () => {
    const content = "- [ ] Secret task [tasks-no-collect:: true]";
    const items = [makeListItem(0, " ")];
    expect(parseTasksFromFile("note.md", content, items)).toHaveLength(0);
  });

  it("still collects other tasks in the same file", () => {
    const content = "- [ ] Secret task [tasks-no-collect:: true]\n- [ ] Visible task";
    const items = [makeListItem(0, " "), makeListItem(1, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe("Visible task");
  });

  it("collects a task marked [tasks-no-collect:: false]", () => {
    const content = "- [ ] Visible task [tasks-no-collect:: false]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks).toHaveLength(1);
  });

  it("strips the tasks-no-collect annotation from displayed text", () => {
    const content = "- [ ] Visible task [tasks-no-collect:: false]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Visible task");
  });

  it("renders only the alias for a piped wikilink", () => {
    const content = "- [ ] Review [[Project Plan|the plan]]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Review the plan");
  });

  it("renders the page name for a bare wikilink", () => {
    const content = "- [ ] Check [[Meeting Notes]]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Check Meeting Notes");
  });

  it("drops the heading ref from a wikilink with no alias", () => {
    const content = "- [ ] See [[Notes#Section]]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("See Notes");
  });

  it("renders only the caption for a markdown link", () => {
    const content = "- [ ] Visit [External](https://example.com)";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Visit External");
  });

  it("has a null repeat when no annotation present", () => {
    const content = "- [ ] Buy groceries";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].repeat).toBeNull();
  });

  it("parses [repeat:: every week]", () => {
    const content = "- [ ] Weekly review [repeat:: every week]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].repeat).toEqual({ count: 1, unit: "week" });
  });

  it("parses [repeat:: every 2 weeks] with plural unit", () => {
    const content = "- [ ] Biweekly sync [repeat:: every 2 weeks]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].repeat).toEqual({ count: 2, unit: "week" });
  });

  it("parses [repeat:: every day]", () => {
    const content = "- [ ] Daily standup [repeat:: every day]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].repeat).toEqual({ count: 1, unit: "day" });
  });

  it("parses [repeat:: every 3 days] with plural unit", () => {
    const content = "- [ ] Water plants [repeat:: every 3 days]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].repeat).toEqual({ count: 3, unit: "day" });
  });

  it("parses [repeat:: every month]", () => {
    const content = "- [ ] Pay rent [repeat:: every month]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].repeat).toEqual({ count: 1, unit: "month" });
  });

  it("parses [repeat:: every year]", () => {
    const content = "- [ ] Renew passport [repeat:: every year]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].repeat).toEqual({ count: 1, unit: "year" });
  });

  it("treats a malformed repeat annotation as absent and leaves text alone", () => {
    const content = "- [ ] Something [repeat:: whenever]";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].repeat).toBeNull();
    expect(tasks[0].text).toBe("Something [repeat:: whenever]");
  });

  it("strips the repeat annotation from displayed text", () => {
    const content = "- [ ] Weekly review [repeat:: every week] extra text";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Weekly review extra text");
  });

  it("has a null parentId for a top-level task", () => {
    const content = "- [ ] Buy groceries";
    const items = [makeListItem(0, " ")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].parentId).toBeNull();
  });

  it("resolves parentId for a task nested directly under another task", () => {
    const content = "- [ ] Plan trip\n  - [ ] Book flight";
    const items = [makeListItem(0, " "), makeListItem(1, " ", 0)];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[1].parentId).toBe("note.md::0");
  });

  it("resolves parentId through a chain of nested subtasks", () => {
    const content = "- [ ] Plan trip\n  - [ ] Book flight\n    - [ ] Pick airline";
    const items = [makeListItem(0, " "), makeListItem(1, " ", 0), makeListItem(2, " ", 1)];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].parentId).toBeNull();
    expect(tasks[1].parentId).toBe("note.md::0");
    expect(tasks[2].parentId).toBe("note.md::1");
  });

  it("walks up through a plain (non-task) bullet to find the nearest task ancestor", () => {
    const content = "- [ ] Plan trip\n  - a note\n    - [ ] Book flight";
    const items = [
      makeListItem(0, " "),
      makeListItem(1, undefined, 0),
      makeListItem(2, " ", 1),
    ];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks).toHaveLength(2);
    expect(tasks[1].parentId).toBe("note.md::0");
  });

  it("strips due, done, and repeat annotations together", () => {
    const content =
      "- [x] Weekly review [due:: 2026-01-15] [repeat:: every week] [done:: 2026-01-15 09:00]";
    const items = [makeListItem(0, "x")];
    const tasks = parseTasksFromFile("note.md", content, items);
    expect(tasks[0].text).toBe("Weekly review");
    expect(tasks[0].repeat).toEqual({ count: 1, unit: "week" });
  });
});

describe("shouldExcludeFile", () => {
  it("returns false when there is no frontmatter", () => {
    expect(shouldExcludeFile(undefined)).toBe(false);
  });

  it("returns false when frontmatter has no tasks-no-collect property", () => {
    expect(shouldExcludeFile({ title: "Note" })).toBe(false);
  });

  it("returns true when frontmatter has tasks-no-collect: true", () => {
    expect(shouldExcludeFile({ "tasks-no-collect": true })).toBe(true);
  });

  it("returns false when tasks-no-collect is explicitly false", () => {
    expect(shouldExcludeFile({ "tasks-no-collect": false })).toBe(false);
  });
});
