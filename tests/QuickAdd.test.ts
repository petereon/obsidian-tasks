import { addQuickTask } from "../src/QuickAdd";
import { TFile } from "obsidian";
import type { TAbstractFile, Vault } from "obsidian";

function makeVault(files: Record<string, string>): {
  vault: Vault;
  getContent: (path: string) => string | undefined;
} {
  const store = { ...files };
  const vault: Vault = {
    getAbstractFileByPath: jest.fn((path: string): TAbstractFile | null => {
      return path in store ? new TFile(path) : null;
    }),
    create: jest.fn(async (path: string, data: string) => {
      store[path] = data;
      return new TFile(path);
    }),
    process: jest.fn(async (file: TFile, fn: (c: string) => string) => {
      const updated = fn(store[file.path] ?? "");
      store[file.path] = updated;
      return updated;
    }),
    getMarkdownFiles: jest.fn(),
    cachedRead: jest.fn(),
    read: jest.fn(),
    on: jest.fn(),
  };
  return { vault, getContent: (path: string) => store[path] };
}

describe("addQuickTask", () => {
  it("appends a task to an empty file", async () => {
    const { vault, getContent } = makeVault({ "Inbox.md": "" });
    await addQuickTask(vault, "Inbox.md", "Buy milk");
    expect(getContent("Inbox.md")).toBe("- [ ] Buy milk\n");
  });

  it("appends a task to a file already ending in a newline", async () => {
    const { vault, getContent } = makeVault({ "Inbox.md": "- [ ] Existing\n" });
    await addQuickTask(vault, "Inbox.md", "Buy milk");
    expect(getContent("Inbox.md")).toBe("- [ ] Existing\n- [ ] Buy milk\n");
  });

  it("appends a task to a file not ending in a newline without gluing onto the last line", async () => {
    const { vault, getContent } = makeVault({ "Inbox.md": "- [ ] Existing" });
    await addQuickTask(vault, "Inbox.md", "Buy milk");
    expect(getContent("Inbox.md")).toBe("- [ ] Existing\n- [ ] Buy milk\n");
  });

  it("creates the inbox file when it doesn't exist", async () => {
    const { vault, getContent } = makeVault({});
    await addQuickTask(vault, "Inbox.md", "Buy milk");
    expect(vault.create).toHaveBeenCalledWith("Inbox.md", "");
    expect(getContent("Inbox.md")).toBe("- [ ] Buy milk\n");
  });

  it("does not create the inbox file when it already exists", async () => {
    const { vault } = makeVault({ "Inbox.md": "" });
    await addQuickTask(vault, "Inbox.md", "Buy milk");
    expect(vault.create).not.toHaveBeenCalled();
  });
});
