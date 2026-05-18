import { App, PluginSettingTab, Setting } from "obsidian";
import type { PluginSettings } from "./settings";

interface PluginHost {
  settings: PluginSettings;
  saveSettings(): Promise<void>;
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
  }
}
