/** @jest-environment jsdom */
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { App } from "obsidian";
import { AppContext } from "../src/components/AppContext";
import { TaskPanel } from "../src/components/TaskPanel";
import { TaskStore } from "../src/TaskStore";
import type { Task } from "../src/types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "a.md::0",
    text: "Buy milk",
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

const fakeApp = {
  vault: { getAbstractFileByPath: () => null },
  workspace: { getLeaf: () => ({ openFile: async () => {} }) },
} as unknown as App;

describe("TaskPanel periodic refresh", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("drops a task from Completed Today once the day rolls over, with no store update", () => {
    jest.setSystemTime(new Date(2024, 0, 1, 23, 59, 30));
    const store = new TaskStore();
    store.updateFile("a.md", [makeTask({ completedAt: new Date(2024, 0, 1, 23, 59, 0) })]);

    render(
      <AppContext.Provider value={fakeApp}>
        <TaskPanel store={store} onRefresh={async () => {}} />
      </AppContext.Provider>
    );
    // Flat view has no collapsible sections, unlike the grouped view's
    // "Completed Today" section (which defaults to collapsed).
    fireEvent.click(screen.getByText("Flat"));

    expect(screen.queryByText("Buy milk")).not.toBeNull();

    // Cross midnight — no file edits, no store.updateFile call at all.
    jest.setSystemTime(new Date(2024, 0, 2, 0, 1, 0));
    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(screen.queryByText("Buy milk")).toBeNull();
  });
});
