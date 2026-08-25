import { advanceRecurringTask, setDueDate, toggleTask, toggleTaskCascade } from "../src/TaskToggler";
import { TFile } from "obsidian";
import type { Vault } from "obsidian";

function makeVault(initialContent: string): { vault: Vault; getContent: () => string } {
  let content = initialContent;
  const vault: Vault = {
    process: jest.fn(async (_file: TFile, fn: (c: string) => string) => {
      content = fn(content);
      return content;
    }),
    getMarkdownFiles: jest.fn(),
    cachedRead: jest.fn(),
    read: jest.fn(),
    getAbstractFileByPath: jest.fn(),
    on: jest.fn(),
  };
  return { vault, getContent: () => content };
}

describe("toggleTask", () => {
  it("marks incomplete task as complete", async () => {
    const { vault, getContent } = makeVault("- [ ] Buy milk");
    await toggleTask(vault, new TFile("note.md"), 0, true);
    expect(getContent()).toMatch(/^- \[x\] Buy milk \[done:: \d{4}-\d{2}-\d{2} \d{2}:\d{2}\]$/);
  });

  it("marks complete task as incomplete and removes done annotation", async () => {
    const { vault, getContent } = makeVault("- [x] Buy milk [done:: 2026-01-15 17:30]");
    await toggleTask(vault, new TFile("note.md"), 0, false);
    expect(getContent()).toBe("- [ ] Buy milk");
  });

  it("replacing done annotation on re-check (no duplicates)", async () => {
    const { vault, getContent } = makeVault("- [x] Buy milk [done:: 2026-01-01 09:00]");
    await toggleTask(vault, new TFile("note.md"), 0, true);
    const result = getContent();
    const matches = result.match(/\[done::/g);
    expect(matches).toHaveLength(1);
  });

  it("only modifies the target line", async () => {
    const { vault, getContent } = makeVault("line 0\n- [ ] Task\nline 2");
    await toggleTask(vault, new TFile("note.md"), 1, true);
    const lines = getContent().split("\n");
    expect(lines[0]).toBe("line 0");
    expect(lines[1]).toMatch(/^- \[x\] Task \[done::/);
    expect(lines[2]).toBe("line 2");
  });

  it("handles indented checkboxes", async () => {
    const { vault, getContent } = makeVault("  - [ ] Indented");
    await toggleTask(vault, new TFile("note.md"), 0, true);
    expect(getContent()).toMatch(/^\s+- \[x\] Indented \[done::/);
  });

  it("calls vault.process with the file", async () => {
    const { vault } = makeVault("- [ ] Task");
    const file = new TFile("note.md");
    await toggleTask(vault, file, 0, true);
    expect(vault.process).toHaveBeenCalledWith(file, expect.any(Function));
  });
});

describe("advanceRecurringTask", () => {
  it("forces the checkbox to unchecked when starting unchecked", async () => {
    const { vault, getContent } = makeVault("- [ ] Weekly review [due:: 2026-01-05]");
    await advanceRecurringTask(vault, new TFile("note.md"), 0, new Date(2026, 0, 12, 0, 0, 0), false);
    expect(getContent()).toMatch(/^- \[ \] Weekly review/);
  });

  it("forces the checkbox to unchecked when starting checked", async () => {
    const { vault, getContent } = makeVault("- [x] Weekly review [due:: 2026-01-05]");
    await advanceRecurringTask(vault, new TFile("note.md"), 0, new Date(2026, 0, 12, 0, 0, 0), false);
    expect(getContent()).toMatch(/^- \[ \] Weekly review/);
  });

  it("rewrites the due date annotation to the next occurrence", async () => {
    const { vault, getContent } = makeVault("- [ ] Weekly review [due:: 2026-01-05]");
    await advanceRecurringTask(vault, new TFile("note.md"), 0, new Date(2026, 0, 12, 0, 0, 0), false);
    expect(getContent()).toBe("- [ ] Weekly review [due:: 2026-01-12]");
  });

  it("rewrites the due date annotation including time when hasTime is true", async () => {
    const { vault, getContent } = makeVault("- [ ] Meeting [due:: 2026-01-05 14:30]");
    await advanceRecurringTask(vault, new TFile("note.md"), 0, new Date(2026, 0, 12, 9, 0, 0), true);
    expect(getContent()).toBe("- [ ] Meeting [due:: 2026-01-12 09:00]");
  });

  it("never adds a done annotation", async () => {
    const { vault, getContent } = makeVault("- [x] Weekly review [due:: 2026-01-05]");
    await advanceRecurringTask(vault, new TFile("note.md"), 0, new Date(2026, 0, 12, 0, 0, 0), false);
    expect(getContent()).not.toMatch(/\[done::/);
  });

  it("leaves an existing repeat annotation untouched", async () => {
    const { vault, getContent } = makeVault(
      "- [x] Weekly review [due:: 2026-01-05] [repeat:: every week]"
    );
    await advanceRecurringTask(vault, new TFile("note.md"), 0, new Date(2026, 0, 12, 0, 0, 0), false);
    expect(getContent()).toBe("- [ ] Weekly review [due:: 2026-01-12] [repeat:: every week]");
  });

  it("only modifies the target line", async () => {
    const { vault, getContent } = makeVault(
      "line 0\n- [x] Weekly review [due:: 2026-01-05]\nline 2"
    );
    await advanceRecurringTask(vault, new TFile("note.md"), 1, new Date(2026, 0, 12, 0, 0, 0), false);
    const lines = getContent().split("\n");
    expect(lines[0]).toBe("line 0");
    expect(lines[1]).toBe("- [ ] Weekly review [due:: 2026-01-12]");
    expect(lines[2]).toBe("line 2");
  });
});

describe("toggleTaskCascade", () => {
  it("completes multiple lines in one write, each with a done annotation", async () => {
    const { vault, getContent } = makeVault(
      "- [ ] Plan trip\n  - [ ] Book flight\n  - [ ] Pack bags"
    );
    await toggleTaskCascade(vault, new TFile("note.md"), [0, 1, 2], true);
    const lines = getContent().split("\n");
    expect(lines[0]).toMatch(/^- \[x\] Plan trip \[done::/);
    expect(lines[1]).toMatch(/^\s*- \[x\] Book flight \[done::/);
    expect(lines[2]).toMatch(/^\s*- \[x\] Pack bags \[done::/);
  });

  it("uncompletes multiple lines and strips done annotations", async () => {
    const { vault, getContent } = makeVault(
      "- [x] Plan trip [done:: 2026-01-01 09:00]\n  - [x] Book flight [done:: 2026-01-01 09:00]"
    );
    await toggleTaskCascade(vault, new TFile("note.md"), [0, 1], false);
    const lines = getContent().split("\n");
    expect(lines[0]).toBe("- [ ] Plan trip");
    expect(lines[1]).toBe("  - [ ] Book flight");
  });

  it("leaves lines outside the given set untouched", async () => {
    const { vault, getContent } = makeVault("- [ ] A\n- [ ] B\n- [ ] C");
    await toggleTaskCascade(vault, new TFile("note.md"), [0, 2], true);
    const lines = getContent().split("\n");
    expect(lines[0]).toMatch(/^- \[x\] A/);
    expect(lines[1]).toBe("- [ ] B");
    expect(lines[2]).toMatch(/^- \[x\] C/);
  });

  it("does not duplicate done annotations on an already-completed line", async () => {
    const { vault, getContent } = makeVault("- [x] A [done:: 2026-01-01 09:00]");
    await toggleTaskCascade(vault, new TFile("note.md"), [0], true);
    const matches = getContent().match(/\[done::/g);
    expect(matches).toHaveLength(1);
  });
});

describe("setDueDate", () => {
  it("adds a due date to a task with none", async () => {
    const { vault, getContent } = makeVault("- [ ] Buy milk");
    await setDueDate(vault, new TFile("note.md"), 0, new Date(2026, 5, 1, 0, 0, 0), false);
    expect(getContent()).toBe("- [ ] Buy milk [due:: 2026-06-01]");
  });

  it("replaces an existing due date", async () => {
    const { vault, getContent } = makeVault("- [ ] Buy milk [due:: 2026-01-05]");
    await setDueDate(vault, new TFile("note.md"), 0, new Date(2026, 5, 1, 14, 30, 0), true);
    expect(getContent()).toBe("- [ ] Buy milk [due:: 2026-06-01 14:30]");
  });

  it("does not accumulate stray whitespace when replacing a due date with extra spacing", async () => {
    const { vault, getContent } = makeVault("- [ ] Buy milk   [due:: 2026-01-05]");
    await setDueDate(vault, new TFile("note.md"), 0, new Date(2026, 5, 1, 0, 0, 0), false);
    expect(getContent()).toBe("- [ ] Buy milk [due:: 2026-06-01]");
  });

  it("clears an existing due date when date is null", async () => {
    const { vault, getContent } = makeVault("- [ ] Buy milk [due:: 2026-01-05]");
    await setDueDate(vault, new TFile("note.md"), 0, null, false);
    expect(getContent()).toBe("- [ ] Buy milk");
  });

  it("preserves a done annotation on the line, matching main.ts's existing reordering behavior", async () => {
    const { vault, getContent } = makeVault(
      "- [x] Buy milk [due:: 2026-01-05] [done:: 2026-01-05 09:00]"
    );
    await setDueDate(vault, new TFile("note.md"), 0, new Date(2026, 5, 1, 0, 0, 0), false);
    expect(getContent()).toBe("- [x] Buy milk [done:: 2026-01-05 09:00] [due:: 2026-06-01]");
  });

  it("preserves a repeat annotation on the line, matching main.ts's existing reordering behavior", async () => {
    const { vault, getContent } = makeVault("- [ ] Weekly review [due:: 2026-01-05] [repeat:: every week]");
    await setDueDate(vault, new TFile("note.md"), 0, new Date(2026, 5, 1, 0, 0, 0), false);
    expect(getContent()).toBe("- [ ] Weekly review [repeat:: every week] [due:: 2026-06-01]");
  });

  it("only modifies the target line", async () => {
    const { vault, getContent } = makeVault("line 0\n- [ ] Buy milk\nline 2");
    await setDueDate(vault, new TFile("note.md"), 1, new Date(2026, 5, 1, 0, 0, 0), false);
    const lines = getContent().split("\n");
    expect(lines[0]).toBe("line 0");
    expect(lines[1]).toBe("- [ ] Buy milk [due:: 2026-06-01]");
    expect(lines[2]).toBe("line 2");
  });
});
