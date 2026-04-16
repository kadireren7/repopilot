"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ScoringEngine_1 = require("./ScoringEngine");
describe("ScoringEngine", () => {
    let engine;
    beforeEach(() => {
        engine = new ScoringEngine_1.ScoringEngine();
    });
    it("should return 100 for a perfect repository", () => {
        const perfectAnalysis = {
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
        const emptyAnalysis = {
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
});
