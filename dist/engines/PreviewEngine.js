"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewEngine = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class PreviewEngine {
    showPreview(files) {
        if (files.length === 0) {
            console.log(chalk_1.default.green("\nNo missing infrastructure files detected."));
            return;
        }
        console.log(chalk_1.default.bold.cyan("\nPlanned file generation"));
        console.log(chalk_1.default.gray("────────────────────────────────────────"));
        files.forEach((file, index) => {
            console.log(`${chalk_1.default.bold(String(index + 1))}. ${chalk_1.default.green(file.path)} - ${file.description}`);
            const lines = file.content.split("\n").slice(0, 5);
            lines.forEach((line) => console.log(`   ${chalk_1.default.dim(line)}`));
            if (file.content.split("\n").length > 5)
                console.log(`   ${chalk_1.default.dim("...")}`);
        });
        console.log("");
    }
    async writeFiles(files, options) {
        for (const file of files) {
            const fullPath = path_1.default.join(options.targetPath, file.path);
            const dir = path_1.default.dirname(fullPath);
            if (options.dryRun) {
                console.log(chalk_1.default.yellow(`[DRY-RUN] ${file.path}`));
                continue;
            }
            if ((await fs_extra_1.default.pathExists(fullPath)) && !options.overwrite) {
                console.log(chalk_1.default.yellow(`[SKIP] ${file.path} already exists. Use --overwrite to replace it.`));
                continue;
            }
            await fs_extra_1.default.ensureDir(dir);
            await fs_extra_1.default.writeFile(fullPath, file.content, "utf8");
            console.log(chalk_1.default.green(`[WRITE] ${file.path}`));
        }
    }
}
exports.PreviewEngine = PreviewEngine;
