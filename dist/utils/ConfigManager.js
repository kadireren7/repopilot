"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class ConfigManager {
    static async load(rootPath) {
        const configPath = path_1.default.join(rootPath, this.CONFIG_FILE);
        if (await fs_extra_1.default.pathExists(configPath)) {
            try {
                return await fs_extra_1.default.readJson(configPath);
            }
            catch {
                console.warn("Warning: failed to parse repopilot.config.json, using defaults.");
            }
        }
        return {};
    }
}
exports.ConfigManager = ConfigManager;
ConfigManager.CONFIG_FILE = "repopilot.config.json";
