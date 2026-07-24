import { App, PluginSettingTab, Setting } from "obsidian";
import type { PluginSettings } from "./settings";

interface PluginHost {
  settings: PluginSettings;
  saveSettings(): Promise<void>;
  initialScan(): Promise<void>;
}

export class TasksSettingsTab extends PluginSettingTab {
  private plugin: PluginHost;

  constructor(app: App, plugin: PluginHost) {
    super(app, plugin as never);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Notification threshold")
      .setDesc(
        "Minutes before a task's due time to send a notification. " +
        "Only tasks with a specific time (not date-only) are notified.",
      )
      .addSlider((slider) =>
        slider
          .setLimits(5, 120, 5)
          .setValue(this.plugin.settings.notifyThresholdMinutes)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.notifyThresholdMinutes = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Ignored files and folders")
      .setDesc(
        "One glob pattern per line. Use ** to match a whole folder " +
        "(e.g. Templates/**), * to match within a single path segment. " +
        "A bare folder name like \"Templates\" only matches a file with " +
        "that exact name — write \"Templates/**\" to exclude everything inside it.",
      )
      .addTextArea((textarea) => {
        textarea.inputEl.rows = 5;
        textarea
          .setPlaceholder("Templates/**\nArchive/**/*.md\nInbox/scratch.md")
          .setValue(this.plugin.settings.ignorePatterns.join("\n"))
          .onChange(async (value) => {
            this.plugin.settings.ignorePatterns = value
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.length > 0);
            await this.plugin.saveSettings();
            await this.plugin.initialScan();
          });
      });

    new Setting(containerEl)
      .setName("Quick-add inbox note")
      .setDesc(
        "Vault-relative path (including .md) that \"Quick add task\" appends new tasks to. " +
        "Created automatically if it doesn't exist yet.",
      )
      .addText((text) =>
        text
          .setPlaceholder("Inbox.md")
          .setValue(this.plugin.settings.quickAddInboxPath)
          .onChange(async (value) => {
            this.plugin.settings.quickAddInboxPath = value.trim();
            await this.plugin.saveSettings();
          }),
      );
  }
}
