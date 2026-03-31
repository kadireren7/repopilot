import path from "path";
import { RepoAnalysis } from "../types";
import { GeneratedFile, TechStack, TemplateContext } from "../types/generation";
import { getDockerIgnoreTemplate, getDockerfileTemplate, getEnvExampleTemplate, getGitHubActionsTemplate } from "../templates";

export class GeneratorEngine {
  private analysis: RepoAnalysis;
  private rootPath: string;

  constructor(analysis: RepoAnalysis, rootPath: string) {
    this.analysis = analysis;
    this.rootPath = rootPath;
  }

  private mapToTechStack(): TechStack {
    if (this.analysis.framework === "Next.js") return "Next.js";
    if (this.analysis.language === "TypeScript/JavaScript") return "Node.js";
    if (this.analysis.language === "Python") return "Python";
    if (this.analysis.language === "Go") return "Go";
    return "Unknown";
  }

  private getContext(): TemplateContext {
    return {
      projectName: path.basename(this.rootPath),
      language: this.analysis.language,
      framework: this.analysis.framework,
      packageManager: this.analysis.packageManager,
    };
  }

  generateMissingFiles(): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const stack = this.mapToTechStack();
    const context = this.getContext();

    if (!this.analysis.hasDockerfile) {
      files.push({ path: "Dockerfile", content: getDockerfileTemplate(stack, context), description: "Standard Dockerfile for containerization." });
    }
    if (!this.analysis.hasDockerIgnore) {
      files.push({
        path: ".dockerignore",
        content: getDockerIgnoreTemplate(),
        description: "Excludes unnecessary files from Docker build context.",
      });
    }
    if (!this.analysis.hasEnvExample) {
      files.push({ path: ".env.example", content: getEnvExampleTemplate(stack), description: "Template for environment variables." });
    }
    if (!this.analysis.hasCI) {
      files.push({
        path: ".github/workflows/ci.yml",
        content: getGitHubActionsTemplate(stack),
        description: "GitHub Actions workflow for CI.",
      });
    }
    return files;
  }
}
