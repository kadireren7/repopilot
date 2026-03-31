"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringEngine = void 0;
class ScoringEngine {
    calculate(analysis) {
        const build = this.calculateBuildScore(analysis);
        const deployment = this.calculateDeploymentScore(analysis);
        const environment = this.calculateEnvironmentScore(analysis);
        const documentation = this.calculateDocumentationScore(analysis);
        const openSource = this.calculateOpenSourceScore(analysis);
        const totalScore = Math.round((build.score + deployment.score + environment.score + documentation.score + openSource.score) / 5);
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
            score += 50;
        else
            issues.push("No standard package manager detected (npm, yarn, pnpm, pip, go mod).");
        if (analysis.language !== "Unknown")
            score += 50;
        else
            issues.push("Could not determine the primary programming language.");
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
            score += 100;
        else
            issues.push("Missing README.md file.");
        return { score, maxScore: 100, issues };
    }
    calculateOpenSourceScore(analysis) {
        let score = 0;
        const issues = [];
        if (analysis.hasLicense)
            score += 100;
        else
            issues.push("Missing LICENSE file.");
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
