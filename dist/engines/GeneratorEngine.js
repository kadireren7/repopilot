"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratorEngine = void 0;
const path_1 = __importDefault(require("path"));
const templates_1 = require("../templates");
class GeneratorEngine {
    constructor(analysis, rootPath) {
        this.analysis = analysis;
        this.rootPath = rootPath;
    }
    mapToTechStack() {
        if (this.analysis.framework === "Next.js")
            return "Next.js";
        if (this.analysis.language === "Rust")
            return "Rust";
        if (this.analysis.language === "Java")
            return "Java";
        if (this.analysis.language === "TypeScript/JavaScript")
            return "Node.js";
        if (this.analysis.language === "Python")
            return "Python";
        if (this.analysis.language === "Go")
            return "Go";
        return "Unknown";
    }
    getContext() {
        return {
            projectName: path_1.default.basename(this.rootPath),
            language: this.analysis.language,
            framework: this.analysis.framework,
            packageManager: this.analysis.packageManager,
        };
    }
    generateMissingFiles() {
        const files = [];
        const stack = this.mapToTechStack();
        const context = this.getContext();
        if (!this.analysis.hasDockerfile) {
            files.push({ path: "Dockerfile", content: (0, templates_1.getDockerfileTemplate)(stack, context), description: "Standard Dockerfile for containerization." });
        }
        if (!this.analysis.hasDockerIgnore) {
            files.push({
                path: ".dockerignore",
                content: (0, templates_1.getDockerIgnoreTemplate)(),
                description: "Excludes unnecessary files from Docker build context.",
            });
        }
        if (!this.analysis.hasEnvExample) {
            files.push({ path: ".env.example", content: (0, templates_1.getEnvExampleTemplate)(stack), description: "Template for environment variables." });
        }
        if (!this.analysis.hasCI) {
            files.push({
                path: ".github/workflows/ci.yml",
                content: (0, templates_1.getGitHubActionsTemplate)(stack),
                description: "GitHub Actions workflow for CI.",
            });
        }
        return files;
    }
}
exports.GeneratorEngine = GeneratorEngine;
