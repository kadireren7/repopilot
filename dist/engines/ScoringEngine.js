"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringEngine = void 0;
const DEFAULT_WEIGHTS = {
    build: 1,
    deployment: 1,
    environment: 1,
    documentation: 1,
    openSource: 1,
};
class ScoringEngine {
    calculate(analysis, categoryWeights) {
        const w = { ...DEFAULT_WEIGHTS, ...categoryWeights };
        const build = this.calculateBuildScore(analysis);
        const deployment = this.calculateDeploymentScore(analysis);
        const environment = this.calculateEnvironmentScore(analysis);
        const documentation = this.calculateDocumentationScore(analysis);
        const openSource = this.calculateOpenSourceScore(analysis);
        const weightedSum = build.score * w.build +
            deployment.score * w.deployment +
            environment.score * w.environment +
            documentation.score * w.documentation +
            openSource.score * w.openSource;
        const weightTotal = w.build + w.deployment + w.environment + w.documentation + w.openSource;
        const totalScore = Math.round(weightedSum / weightTotal);
        return {
            totalScore,
            categories: { build, deployment, environment, documentation, openSource },
            summary: this.generateSummary(totalScore),
        };
    }
    calculateBuildScore(analysis) {
        let score = 0;
        const issues = [];
        if (analysis.packageManager !== "Unknown")
            score += 35;
        else
            issues.push("No standard package manager detected (npm, yarn, pnpm, pip, cargo, go mod, etc.).");
        if (analysis.language !== "Unknown")
            score += 35;
        else
            issues.push("Could not determine the primary programming language.");
        if (analysis.hasTests)
            score += 30;
        else
            issues.push("No automated tests detected (add unit/integration tests or a test config).");
        return { score, maxScore: 100, issues };
    }
    calculateDeploymentScore(analysis) {
        let score = 0;
        const issues = [];
        if (analysis.hasDockerfile)
            score += 50;
        else
            issues.push("Missing Dockerfile for containerized deployment.");
        if (analysis.hasCI)
            score += 50;
        else
            issues.push("No CI/CD workflows detected (GitHub Actions, GitLab CI, etc.).");
        return { score, maxScore: 100, issues };
    }
    calculateEnvironmentScore(analysis) {
        let score = 0;
        const issues = [];
        if (analysis.hasEnvExample)
            score += 100;
        else
            issues.push("Missing .env.example file for environment variable documentation.");
        return { score, maxScore: 100, issues };
    }
    calculateDocumentationScore(analysis) {
        let score = 0;
        const issues = [];
        if (analysis.hasReadme)
            score += 60;
        else
            issues.push("Missing README.md file.");
        if (analysis.hasContributing)
            score += 20;
        else
            issues.push("Missing CONTRIBUTING.md for contributor onboarding.");
        if (analysis.hasChangelog)
            score += 20;
        else
            issues.push("Missing CHANGELOG.md (or HISTORY.md) for release notes.");
        return { score, maxScore: 100, issues };
    }
    calculateOpenSourceScore(analysis) {
        let score = 0;
        const issues = [];
        if (analysis.hasLicense)
            score += 75;
        else
            issues.push("Missing LICENSE file.");
        if (analysis.hasSecurityPolicy)
            score += 25;
        else
            issues.push("Missing SECURITY.md for vulnerability reporting.");
        return { score, maxScore: 100, issues };
    }
    generateSummary(score) {
        if (score >= 90)
            return "Excellent: your repository is production-ready.";
        if (score >= 70)
            return "Good baseline: a few infrastructure improvements are still needed.";
        if (score >= 50)
            return "Fair: significant deployment and documentation work is required.";
        return "Needs work: this repository lacks essential production infrastructure.";
    }
}
exports.ScoringEngine = ScoringEngine;
