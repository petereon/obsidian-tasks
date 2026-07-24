export interface PluginSettings {
  notifyThresholdMinutes: number;
  ignorePatterns: string[];
  quickAddInboxPath: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  notifyThresholdMinutes: 15,
  ignorePatterns: [],
  quickAddInboxPath: "",
};
