import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { GeneratedFile, GenerationOptions } from "../types/generation";

export class PreviewEngine {
  showPreview(files: GeneratedFile[]): void {
    if (files.length === 0) {
      console.log(chalk.green("\nNo missing infrastructure files detected."));
      return;
    }

    console.log(chalk.bold.cyan("\nPlanned file generation"));
    console.log(chalk.gray("────────────────────────────────────────"));
    files.forEach((file, index) => {
      console.log(`${chalk.bold(String(index + 1))}. ${chalk.green(file.path)} - ${file.description}`);
      const lines = file.content.split("\n").slice(0, 5);
      lines.forEach((line) => console.log(`   ${chalk.dim(line)}`));
      if (file.content.split("\n").length > 5) console.log(`   ${chalk.dim("...")}`);
    });
    console.log("");
  }

  async writeFiles(files: GeneratedFile[], options: GenerationOptions): Promise<void> {
    for (const file of files) {
      const fullPath = path.join(options.targetPath, file.path);
      const dir = path.dirname(fullPath);

      if (options.dryRun) {
        console.log(chalk.yellow(`[DRY-RUN] ${file.path}`));
        continue;
      }

      if ((await fs.pathExists(fullPath)) && !options.overwrite) {
        console.log(chalk.yellow(`[SKIP] ${file.path} already exists. Use --overwrite to replace it.`));
        continue;
      }

      await fs.ensureDir(dir);
      await fs.writeFile(fullPath, file.content, "utf8");
      console.log(chalk.green(`[WRITE] ${file.path}`));
    }
  }
}
