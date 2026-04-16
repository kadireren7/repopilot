import fs from "fs-extra";
import path from "path";
import { RepoAnalysis } from "../types";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "target", ".venv", "venv", "__pycache__"]);

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
    const relFiles = files.map((f) => path.relative(this.rootPath, f).replace(/\\/g, "/"));

    const [packageJson, requirementsTxt, goMod, cargoToml, pyprojectToml] = await Promise.all([
      this.readJson("package.json"),
      this.readText("requirements.txt"),
      this.readText("go.mod"),
      this.readText("Cargo.toml"),
      this.readText("pyproject.toml"),
    ]);

    const language = this.detectLanguage(relFiles, packageJson, requirementsTxt, goMod, cargoToml, pyprojectToml);
    const framework = this.detectFramework(packageJson, requirementsTxt, goMod, cargoToml, pyprojectToml);

    return {
      language,
      framework,
      packageManager: this.detectPackageManager(relFiles),
      files: relFiles,
      hasDockerfile: relFiles.some((f) => f === "Dockerfile" || f.endsWith("/Dockerfile")),
      hasDockerIgnore: relFiles.some((f) => f === ".dockerignore" || f.endsWith("/.dockerignore")),
      hasEnvExample: relFiles.some((f) => f.endsWith(".env.example")),
      hasCI: relFiles.some((f) => f.includes(".github/workflows") || f.includes(".gitlab-ci.yml") || f.includes("circleci")),
      hasReadme: relFiles.some((f) => f.toLowerCase().endsWith("readme.md")),
      hasLicense: relFiles.some((f) => {
        const n = f.toLowerCase();
        return n.endsWith("license") || n.endsWith("license.md") || n.endsWith("license.txt");
      }),
      hasTests: this.detectHasTests(relFiles),
      hasSecurityPolicy: relFiles.some((f) => f.toLowerCase() === "security.md" || f.toLowerCase().endsWith("/security.md")),
      hasContributing: relFiles.some((f) => f.toLowerCase() === "contributing.md" || f.toLowerCase().endsWith("/contributing.md")),
      hasChangelog: relFiles.some((f) => {
        const n = f.toLowerCase();
        return n === "changelog.md" || n.endsWith("/changelog.md") || n === "history.md" || n.endsWith("/history.md");
      }),
    };
  }

  private async getAllFiles(dir: string, fileList: string[] = []): Promise<string[]> {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (SKIP_DIRS.has(file)) continue;
      const name = path.join(dir, file);
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

  private detectHasTests(files: string[]): boolean {
    for (const f of files) {
      const lower = f.toLowerCase();
      if (/\/(e2e|__tests__|__test__|tests?|spec|specs)\//.test(lower)) return true;
      if (/\.(test|spec)\.(jsx?|tsx?|mjs|cjs|cts|mts)$/.test(lower)) return true;
      if (/_test\.go$/.test(lower) || /_test\.rs$/.test(lower)) return true;
      if (/test_.*\.py$/.test(lower) || /.*_test\.py$/.test(lower)) return true;
      if (lower.endsWith("jest.config.js") || lower.endsWith("jest.config.ts") || lower.includes("vitest.config")) return true;
      if (lower.endsWith("pytest.ini") || lower.endsWith("tox.ini")) return true;
      if (lower.endsWith("mvnw") || lower.endsWith("gradlew")) continue;
      if (lower.endsWith("pom.xml") && files.some((x) => x.includes("/src/test/"))) return true;
    }
    if (files.some((f) => f.includes("/src/test/java/") || f.includes("/src/test/kotlin/"))) return true;
    if (files.some((f) => f.includes("/tests/") && (f.endsWith(".rs") || f.endsWith(".go")))) return true;
    return false;
  }

  private detectLanguage(
    files: string[],
    packageJson: any,
    requirementsTxt: string | null,
    goMod: string | null,
    cargoToml: string | null,
    pyprojectToml: string | null
  ): string {
    if (packageJson) return "TypeScript/JavaScript";
    if (pyprojectToml || requirementsTxt) return "Python";
    if (goMod) return "Go";
    if (cargoToml) return "Rust";
    if (files.some((f) => f === "pom.xml" || f.endsWith("pom.xml") || f.endsWith("build.gradle") || f.endsWith("build.gradle.kts")))
      return "Java";

    const extensions = files.map((f) => path.extname(f));
    if (extensions.includes(".ts") || extensions.includes(".tsx")) return "TypeScript";
    if (extensions.includes(".js") || extensions.includes(".jsx")) return "JavaScript";
    if (extensions.includes(".py")) return "Python";
    if (extensions.includes(".go")) return "Go";
    if (extensions.includes(".rs")) return "Rust";
    if (extensions.includes(".java") || extensions.includes(".kt")) return "Java";

    return "Unknown";
  }

  private detectFramework(
    packageJson: any,
    requirementsTxt: string | null,
    goMod: string | null,
    cargoToml: string | null,
    pyprojectToml: string | null
  ): string {
    if (packageJson) {
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (deps.next) return "Next.js";
      if (deps.react) return "React";
      if (deps.vue) return "Vue";
      if (deps.express) return "Express";
      if (deps["@nestjs/core"] || deps.nestjs) return "NestJS";
    }
    if (requirementsTxt) {
      if (requirementsTxt.includes("django")) return "Django";
      if (requirementsTxt.includes("flask")) return "Flask";
      if (requirementsTxt.includes("fastapi")) return "FastAPI";
    }
    if (pyprojectToml) {
      const t = pyprojectToml.toLowerCase();
      if (t.includes("django")) return "Django";
      if (t.includes("flask")) return "Flask";
      if (t.includes("fastapi")) return "FastAPI";
      if (t.includes("pytest")) return "Python";
    }
    if (goMod) {
      if (goMod.includes("gin-gonic")) return "Gin";
      if (goMod.includes("beego")) return "Beego";
    }
    if (cargoToml) {
      if (cargoToml.includes("actix")) return "Actix";
      if (cargoToml.includes("rocket")) return "Rocket";
      if (cargoToml.includes("axum")) return "Axum";
    }
    return "Vanilla / Other";
  }

  private detectPackageManager(files: string[]): string {
    if (files.some((f) => f.endsWith("package-lock.json"))) return "npm";
    if (files.some((f) => f.endsWith("yarn.lock"))) return "yarn";
    if (files.some((f) => f.endsWith("pnpm-lock.yaml"))) return "pnpm";
    if (files.some((f) => f.endsWith("requirements.txt") || f.endsWith("pyproject.toml"))) return "pip/poetry";
    if (files.some((f) => f.endsWith("go.sum"))) return "go mod";
    if (files.some((f) => f.endsWith("Cargo.toml"))) return "cargo";
    if (files.some((f) => f.endsWith("pom.xml"))) return "maven";
    if (files.some((f) => f.endsWith("build.gradle") || f.endsWith("build.gradle.kts"))) return "gradle";
    return "Unknown";
  }
}
