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
    };

    const score = engine.calculate(emptyAnalysis);
    expect(score.totalScore).toBeLessThan(30);
  });
});
