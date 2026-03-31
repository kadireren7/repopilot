import fs from "fs-extra";
import path from "path";

export interface RepoPilotConfig {
  exclude?: string[];
  threshold?: number;
  github?: {
    defaultBranch?: string;
    prTitle?: string;
  };
}

export class ConfigManager {
  private static readonly CONFIG_FILE = "repopilot.config.json";

  static async load(rootPath: string): Promise<RepoPilotConfig> {
    const configPath = path.join(rootPath, this.CONFIG_FILE);
    if (await fs.pathExists(configPath)) {
      try {
        return await fs.readJson(configPath);
      } catch {
        console.warn("Warning: failed to parse repopilot.config.json, using defaults.");
      }
    }
    return {};
  }
}
