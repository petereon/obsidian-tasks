export interface PluginSettings {
  notifyThresholdMinutes: number;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  notifyThresholdMinutes: 15,
};
