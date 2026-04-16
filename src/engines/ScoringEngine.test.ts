import { RepoAnalysis } from "../types";
import { ScoringEngine } from "./ScoringEngine";

describe("ScoringEngine", () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = new ScoringEngine();
  });

  it("should return 100 for a perfect repository", () => {
    const perfectAnalysis: RepoAnalysis = {
      language: "TypeScript",
      framework: "Next.js",
      packageManager: "npm",
      files: [],
      hasDockerfile: true,
      hasDockerIgnore: true,
      hasEnvExample: true,
      hasCI: true,
      hasReadme: true,
      hasLicense: true,
      hasTests: true,
      hasSecurityPolicy: true,
      hasContributing: true,
      hasChangelog: true,
    };

    const score = engine.calculate(perfectAnalysis);
    expect(score.totalScore).toBe(100);
  });

  it("should return a low score for an empty repository", () => {
    const emptyAnalysis: RepoAnalysis = {
      language: "Unknown",
      framework: "Vanilla / Other",
      packageManager: "Unknown",
      files: [],
      hasDockerfile: false,
      hasDockerIgnore: false,
      hasEnvExample: false,
      hasCI: false,
      hasReadme: false,
      hasLicense: false,
      hasTests: false,
      hasSecurityPolicy: false,
      hasContributing: false,
      hasChangelog: false,
    };

    const score = engine.calculate(emptyAnalysis);
    expect(score.totalScore).toBeLessThan(30);
  });

  it("applies category weights to the total score", () => {
    const base: RepoAnalysis = {
      language: "TypeScript",
      framework: "React",
      packageManager: "npm",
      files: [],
      hasDockerfile: false,
      hasDockerIgnore: true,
      hasEnvExample: true,
      hasCI: false,
      hasReadme: true,
      hasLicense: true,
      hasTests: true,
      hasSecurityPolicy: true,
      hasContributing: true,
      hasChangelog: true,
    };
    const uniform = engine.calculate(base);
    const ignoreDeployment = engine.calculate(base, {
      deployment: 0,
      build: 1,
      environment: 1,
      documentation: 1,
      openSource: 1,
    });
    expect(uniform.totalScore).toBe(80);
    expect(ignoreDeployment.totalScore).toBe(100);
  });
});
