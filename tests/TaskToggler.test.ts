import { toggleTask } from "../src/TaskToggler";
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
