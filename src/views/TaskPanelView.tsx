import { ItemView, WorkspaceLeaf } from "obsidian";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import type { TaskStore } from "../TaskStore";
import { TaskPanel } from "../components/TaskPanel";
import { AppContext } from "../components/AppContext";

export const TASK_PANEL_VIEW_TYPE = "obsidian-tasks-panel";

export class TaskPanelView extends ItemView {
  private root: Root | null = null;
  private store: TaskStore;
  private onRefresh: () => Promise<void>;

  constructor(leaf: WorkspaceLeaf, store: TaskStore, onRefresh: () => Promise<void>) {
    super(leaf);
    this.store = store;
    this.onRefresh = onRefresh;
  }

  getViewType(): string {
    return TASK_PANEL_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Tasks";
  }

  getIcon(): string {
    return "check-square";
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.contentEl);
    this.root.render(
      <StrictMode>
        <AppContext.Provider value={this.app}>
          <TaskPanel store={this.store} onRefresh={this.onRefresh} />
        </AppContext.Provider>
      </StrictMode>
    );
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
    this.root = null;
  }
}
