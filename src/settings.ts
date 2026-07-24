export interface PluginSettings {
  notifyThresholdMinutes: number;
  ignorePatterns: string[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
  notifyThresholdMinutes: 15,
  ignorePatterns: [],
};
