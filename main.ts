import { Notice, Plugin, TFile } from "obsidian";
import { parseTasksFromFile, shouldExcludeFile } from "./src/TaskParser";
import { TaskStore } from "./src/TaskStore";
import { advanceRecurringTask, toggleTask } from "./src/TaskToggler";
import { DUE_REGEX, formatDueAnnotation } from "./src/dueDate";
import { nextOccurrence } from "./src/Recurrence";
import { formatDue } from "./src/formatDue";
import { TASK_PANEL_VIEW_TYPE, TaskPanelView } from "./src/views/TaskPanelView";
import { DueDateModal } from "./src/modals/DueDateModal";
import { Notifier } from "./src/Notifier";
import { TasksSettingsTab } from "./src/SettingsTab";
import { DEFAULT_SETTINGS, type PluginSettings } from "./src/settings";

const DUE_RE_G = /\s*\[due::\s*\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?\]/g;

export default class ObsidianTasksPlugin extends Plugin {
  private store: TaskStore = new TaskStore();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private notifier!: Notifier;
  settings: PluginSettings = { ...DEFAULT_SETTINGS };

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async onload(): Promise<void> {
    await this.loadSettings();

    this.notifier = new Notifier(this.app);
    this.addSettingTab(new TasksSettingsTab(this.app, this));

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }

    this.registerInterval(
      window.setInterval(() => {
        this.notifier.check(this.store.getAllTasks(), this.settings.notifyThresholdMinutes);
      }, 60_000),
    );

    this.registerView(
      TASK_PANEL_VIEW_TYPE,
      (leaf) => new TaskPanelView(leaf, this.store, () => this.initialScan())
    );

    this.addRibbonIcon("check-square", "Open Tasks panel", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-tasks-panel",
      name: "Open Tasks panel",
      callback: () => void this.activateView(),
    });

    this.addCommand({
      id: "set-due-date",
      name: "Set due date",
      editorCallback: (editor) => {
        const line = editor.getCursor().line;
        const lineText = editor.getLine(line);
        if (!/^\s*- \[.\]/.test(lineText)) return;

        const match = lineText.match(DUE_REGEX);
        let initialDate: Date | null = null;
        let initialHasTime = false;
        if (match) {
          const [, dateStr, timeStr] = match;
          const [y, mo, d] = (dateStr as string).split("-").map(Number);
          if (timeStr) {
            const [h, mi] = (timeStr as string).split(":").map(Number);
            initialDate = new Date(y, mo - 1, d, h, mi, 0);
            initialHasTime = true;
          } else {
            initialDate = new Date(y, mo - 1, d, 0, 0, 0);
          }
        }

        new DueDateModal(this.app, initialDate, initialHasTime, (date, hasTime) => {
          let updated = lineText.replace(DUE_RE_G, "").replace(/\s+$/, "");
          if (date !== null) {
            updated = `${updated} ${formatDueAnnotation(date, hasTime)}`;
          }
          editor.setLine(line, updated);
        }).open();
      },
    });

    this.app.workspace.onLayoutReady(() => {
      void this.initialScan().then(() => {
        this.notifier.check(this.store.getAllTasks(), this.settings.notifyThresholdMinutes);
      });
    });

    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        this.scheduleReparse(file);
      })
    );

    this.registerEvent(
      this.app.vault.on("delete", (abstractFile) => {
        if (abstractFile instanceof TFile) {
          this.store.removeFile(abstractFile.path);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on("rename", (abstractFile, oldPath) => {
        if (abstractFile instanceof TFile) {
          this.store.removeFile(oldPath);
          void this.parseFile(abstractFile);
        }
      })
    );
  }

  onunload(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  private async initialScan(): Promise<void> {
    const files = this.app.vault.getMarkdownFiles();
    await Promise.all(files.map((file) => this.parseFile(file)));
  }

  private scheduleReparse(file: TFile): void {
    const existing = this.debounceTimers.get(file.path);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.debounceTimers.delete(file.path);
      void this.parseFile(file);
    }, 500);
    this.debounceTimers.set(file.path, timer);
  }

  private async parseFile(file: TFile): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    if (
      shouldExcludeFile(cache?.frontmatter) ||
      !cache?.listItems?.some((item) => item.task !== undefined)
    ) {
      this.store.removeFile(file.path);
      return;
    }
    const content = await this.app.vault.cachedRead(file);
    const newTasks = parseTasksFromFile(file.path, content, cache.listItems ?? []);

    // Detect tasks that just became completed (editor check or panel check) and
    // lack a [done:: ...] annotation. Only fires when we have prior store data —
    // skips initial scan so pre-existing [x] tasks are not retroactively annotated.
    const oldById = new Map(this.store.getFileTasks(file.path).map((t) => [t.id, t]));
    const needsAnnotation = newTasks.filter((t) => {
      const old = oldById.get(t.id);
      return t.completed && !t.completedAt && old !== undefined && !old.completed;
    });
    const needsStrip = newTasks.filter((t) => !t.completed && t.completedAt !== undefined);

    if (needsAnnotation.length > 0 || needsStrip.length > 0) {
      // Write annotations — vault.process fires changed again, but next parse
      // will find completedAt set (or unset) and take no action.
      for (const task of needsAnnotation) {
        if (task.repeat && task.due) {
          const nextDue = nextOccurrence(task.due, task.repeat, new Date());
          await advanceRecurringTask(this.app.vault, file, task.line, nextDue, task.hasTime);
          new Notice(`Advanced to ${formatDue(nextDue, task.hasTime)}`);
        } else {
          await toggleTask(this.app.vault, file, task.line, true);
        }
      }
      for (const task of needsStrip) {
        await toggleTask(this.app.vault, file, task.line, false);
      }
      // Let the subsequent changed event re-parse and update store
      return;
    }

    this.store.updateFile(file.path, newTasks);
  }

  private async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(TASK_PANEL_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: TASK_PANEL_VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }
}
