import { TaskStore } from "../src/TaskStore";
import type { Task } from "../src/types";

function makeTask(id: string, filePath = "note.md"): Task {
  return { id, text: "Task " + id, due: null, hasTime: false, completed: false, filePath, fileName: "note", line: 0 };
}

describe("TaskStore", () => {
  it("returns empty array initially", () => {
    expect(new TaskStore().getAllTasks()).toEqual([]);
  });

  it("stores tasks per file", () => {
    const store = new TaskStore();
    store.updateFile("a.md", [makeTask("a::0"), makeTask("a::1")]);
    expect(store.getAllTasks()).toHaveLength(2);
  });

  it("replaces tasks for updated file", () => {
    const store = new TaskStore();
    store.updateFile("a.md", [makeTask("a::0"), makeTask("a::1")]);
    store.updateFile("a.md", [makeTask("a::0")]);
    expect(store.getAllTasks()).toHaveLength(1);
  });

  it("merges tasks from multiple files", () => {
    const store = new TaskStore();
    store.updateFile("a.md", [makeTask("a::0", "a.md")]);
    store.updateFile("b.md", [makeTask("b::0", "b.md")]);
    expect(store.getAllTasks()).toHaveLength(2);
  });

  it("removes tasks when file is deleted", () => {
    const store = new TaskStore();
    store.updateFile("a.md", [makeTask("a::0")]);
    store.removeFile("a.md");
    expect(store.getAllTasks()).toHaveLength(0);
  });

  it("calls subscribers on updateFile", () => {
    const store = new TaskStore();
    const listener = jest.fn();
    store.subscribe(listener);
    store.updateFile("a.md", [makeTask("a::0")]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("calls subscribers on removeFile", () => {
    const store = new TaskStore();
    const listener = jest.fn();
    store.updateFile("a.md", [makeTask("a::0")]);
    store.subscribe(listener);
    store.removeFile("a.md");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe stops notifications", () => {
    const store = new TaskStore();
    const listener = jest.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.updateFile("a.md", [makeTask("a::0")]);
    expect(listener).not.toHaveBeenCalled();
  });
});
