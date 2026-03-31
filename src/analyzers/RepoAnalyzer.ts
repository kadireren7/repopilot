import fs from "fs-extra";
import path from "path";
import { RepoAnalysis } from "../types";

export class RepoAnalyzer {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  async analyze(): Promise<RepoAnalysis> {
    if (!(await fs.pathExists(this.rootPath))) {
      throw new Error(`Path does not exist: ${this.rootPath}`);
    }

    const files = await this.getAllFiles(this.rootPath);
    const [packageJson, requirementsTxt, goMod] = await Promise.all([
      this.readJson("package.json"),
      this.readText("requirements.txt"),
      this.readText("go.mod"),
    ]);

    return {
      language: this.detectLanguage(files, packageJson, requirementsTxt, goMod),
      framework: this.detectFramework(packageJson, requirementsTxt, goMod),
      packageManager: this.detectPackageManager(files),
      files: files.map((f) => path.relative(this.rootPath, f)),
      hasDockerfile: files.some((f) => f.endsWith("Dockerfile")),
      hasDockerIgnore: files.some((f) => f.endsWith(".dockerignore")),
      hasEnvExample: files.some((f) => f.endsWith(".env.example")),
      hasCI: files.some((f) => f.includes(".github/workflows") || f.includes(".gitlab-ci.yml") || f.includes("circleci")),
      hasReadme: files.some((f) => f.toLowerCase().endsWith("readme.md")),
      hasLicense: files.some((f) => f.toLowerCase().endsWith("license")),
    };
  }

  private async getAllFiles(dir: string, fileList: string[] = []): Promise<string[]> {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const name = path.join(dir, file);
      if (file === "node_modules" || file === ".git" || file === "dist" || file === "build") continue;
      const stat = await fs.stat(name);
      if (stat.isDirectory()) {
        await this.getAllFiles(name, fileList);
      } else {
        fileList.push(name);
      }
    }
    return fileList;
  }

  private async readJson(fileName: string): Promise<any> {
    const filePath = path.join(this.rootPath, fileName);
    if (await fs.pathExists(filePath)) {
      return fs.readJson(filePath);
    }
    return null;
  }

  private async readText(fileName: string): Promise<string | null> {
    const filePath = path.join(this.rootPath, fileName);
    if (await fs.pathExists(filePath)) {
      return fs.readFile(filePath, "utf-8");
    }
    return null;
  }

  private detectLanguage(files: string[], packageJson: any, requirementsTxt: string | null, goMod: string | null): string {
    if (packageJson) return "TypeScript/JavaScript";
    if (requirementsTxt) return "Python";
    if (goMod) return "Go";

    const extensions = files.map((f) => path.extname(f));
    if (extensions.includes(".ts") || extensions.includes(".tsx")) return "TypeScript";
    if (extensions.includes(".js") || extensions.includes(".jsx")) return "JavaScript";
    if (extensions.includes(".py")) return "Python";
    if (extensions.includes(".go")) return "Go";
    if (extensions.includes(".rs")) return "Rust";
    if (extensions.includes(".java")) return "Java";

    return "Unknown";
  }

  private detectFramework(packageJson: any, requirementsTxt: string | null, goMod: string | null): string {
    if (packageJson) {
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (deps.next) return "Next.js";
      if (deps.react) return "React";
      if (deps.vue) return "Vue";
      if (deps.express) return "Express";
      if (deps.nest) return "NestJS";
    }
    if (requirementsTxt) {
      if (requirementsTxt.includes("django")) return "Django";
      if (requirementsTxt.includes("flask")) return "Flask";
      if (requirementsTxt.includes("fastapi")) return "FastAPI";
    }
    if (goMod) {
      if (goMod.includes("gin-gonic")) return "Gin";
      if (goMod.includes("beego")) return "Beego";
    }
    return "Vanilla / Other";
  }

  private detectPackageManager(files: string[]): string {
    if (files.some((f) => f.endsWith("package-lock.json"))) return "npm";
    if (files.some((f) => f.endsWith("yarn.lock"))) return "yarn";
    if (files.some((f) => f.endsWith("pnpm-lock.yaml"))) return "pnpm";
    if (files.some((f) => f.endsWith("requirements.txt"))) return "pip";
    if (files.some((f) => f.endsWith("go.sum"))) return "go mod";
    return "Unknown";
  }
}
