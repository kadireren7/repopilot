export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
}

export interface GenerationOptions {
  dryRun?: boolean;
  overwrite?: boolean;
  targetPath: string;
}

export type TechStack = "Next.js" | "Node.js" | "Python" | "Go" | "Rust" | "Java" | "Unknown";

export interface TemplateContext {
  projectName: string;
  language: string;
  framework: string;
  packageManager: string;
  mainEntry?: string;
}
