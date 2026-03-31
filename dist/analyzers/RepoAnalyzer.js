"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepoAnalyzer = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class RepoAnalyzer {
    constructor(rootPath) {
        this.rootPath = rootPath;
    }
    async analyze() {
        if (!(await fs_extra_1.default.pathExists(this.rootPath))) {
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
            files: files.map((f) => path_1.default.relative(this.rootPath, f)),
            hasDockerfile: files.some((f) => f.endsWith("Dockerfile")),
            hasDockerIgnore: files.some((f) => f.endsWith(".dockerignore")),
            hasEnvExample: files.some((f) => f.endsWith(".env.example")),
            hasCI: files.some((f) => f.includes(".github/workflows") || f.includes(".gitlab-ci.yml") || f.includes("circleci")),
            hasReadme: files.some((f) => f.toLowerCase().endsWith("readme.md")),
            hasLicense: files.some((f) => f.toLowerCase().endsWith("license")),
        };
    }
    async getAllFiles(dir, fileList = []) {
        const files = await fs_extra_1.default.readdir(dir);
        for (const file of files) {
            const name = path_1.default.join(dir, file);
            if (file === "node_modules" || file === ".git" || file === "dist" || file === "build")
                continue;
            const stat = await fs_extra_1.default.stat(name);
            if (stat.isDirectory()) {
                await this.getAllFiles(name, fileList);
            }
            else {
                fileList.push(name);
            }
        }
        return fileList;
    }
    async readJson(fileName) {
        const filePath = path_1.default.join(this.rootPath, fileName);
        if (await fs_extra_1.default.pathExists(filePath)) {
            return fs_extra_1.default.readJson(filePath);
        }
        return null;
    }
    async readText(fileName) {
        const filePath = path_1.default.join(this.rootPath, fileName);
        if (await fs_extra_1.default.pathExists(filePath)) {
            return fs_extra_1.default.readFile(filePath, "utf-8");
        }
        return null;
    }
    detectLanguage(files, packageJson, requirementsTxt, goMod) {
        if (packageJson)
            return "TypeScript/JavaScript";
        if (requirementsTxt)
            return "Python";
        if (goMod)
            return "Go";
        const extensions = files.map((f) => path_1.default.extname(f));
        if (extensions.includes(".ts") || extensions.includes(".tsx"))
            return "TypeScript";
        if (extensions.includes(".js") || extensions.includes(".jsx"))
            return "JavaScript";
        if (extensions.includes(".py"))
            return "Python";
        if (extensions.includes(".go"))
            return "Go";
        if (extensions.includes(".rs"))
            return "Rust";
        if (extensions.includes(".java"))
            return "Java";
        return "Unknown";
    }
    detectFramework(packageJson, requirementsTxt, goMod) {
        if (packageJson) {
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            if (deps.next)
                return "Next.js";
            if (deps.react)
                return "React";
            if (deps.vue)
                return "Vue";
            if (deps.express)
                return "Express";
            if (deps.nest)
                return "NestJS";
        }
        if (requirementsTxt) {
            if (requirementsTxt.includes("django"))
                return "Django";
            if (requirementsTxt.includes("flask"))
                return "Flask";
            if (requirementsTxt.includes("fastapi"))
                return "FastAPI";
        }
        if (goMod) {
            if (goMod.includes("gin-gonic"))
                return "Gin";
            if (goMod.includes("beego"))
                return "Beego";
        }
        return "Vanilla / Other";
    }
    detectPackageManager(files) {
        if (files.some((f) => f.endsWith("package-lock.json")))
            return "npm";
        if (files.some((f) => f.endsWith("yarn.lock")))
            return "yarn";
        if (files.some((f) => f.endsWith("pnpm-lock.yaml")))
            return "pnpm";
        if (files.some((f) => f.endsWith("requirements.txt")))
            return "pip";
        if (files.some((f) => f.endsWith("go.sum")))
            return "go mod";
        return "Unknown";
    }
}
exports.RepoAnalyzer = RepoAnalyzer;
