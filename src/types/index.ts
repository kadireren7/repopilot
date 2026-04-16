export interface RepoAnalysis {
  language: string;
  framework: string;
  packageManager: string;
  files: string[];
  hasDockerfile: boolean;
  hasDockerIgnore: boolean;
  hasEnvExample: boolean;
  hasCI: boolean;
  hasReadme: boolean;
  hasLicense: boolean;
  hasTests: boolean;
  hasSecurityPolicy: boolean;
  hasContributing: boolean;
  hasChangelog: boolean;
}

export interface ScoreCategory {
  score: number;
  maxScore: number;
  issues: string[];
}

export interface ShipReadinessScore {
  totalScore: number;
  categories: {
    build: ScoreCategory;
    deployment: ScoreCategory;
    environment: ScoreCategory;
    documentation: ScoreCategory;
    openSource: ScoreCategory;
  };
  summary: string;
}

export interface Recommendation {
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
}

export interface DeploymentSuggestion {
  platform: string;
  reason: string;
  steps: string[];
}

export interface AnalysisReport {
  repoPath: string;
  analysis: RepoAnalysis;
  score: ShipReadinessScore;
  recommendations: Recommendation[];
  deploymentSuggestions: DeploymentSuggestion[];
}
