"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationEngine = void 0;
class RecommendationEngine {
    getRecommendations(analysis) {
        const recommendations = [];
        if (!analysis.hasDockerfile) {
            recommendations.push({
                title: "Add Dockerfile",
                description: "A Dockerfile allows your application to be containerized and deployed consistently.",
                action: "Create a Dockerfile in the root directory.",
                priority: "high",
            });
        }
        if (!analysis.hasDockerIgnore) {
            recommendations.push({
                title: "Add .dockerignore",
                description: "A .dockerignore file keeps unnecessary files out of image builds.",
                action: "Create a .dockerignore file and exclude node_modules, .git, and build outputs.",
                priority: "medium",
            });
        }
        if (!analysis.hasEnvExample) {
            recommendations.push({
                title: "Add .env.example",
                description: "An .env.example documents required environment variables for contributors.",
                action: "Create an .env.example file with placeholder values only.",
                priority: "high",
            });
        }
        if (!analysis.hasCI) {
            recommendations.push({
                title: "Add CI workflow",
                description: "A CI workflow automatically validates changes before merge.",
                action: "Create a GitHub Actions workflow in .github/workflows/ci.yml.",
                priority: "medium",
            });
        }
        if (!analysis.hasReadme) {
            recommendations.push({
                title: "Improve README.md",
                description: "A complete README is essential for onboarding and maintenance.",
                action: "Create or expand README.md with setup, usage, and contribution guidance.",
                priority: "high",
            });
        }
        if (!analysis.hasLicense) {
            recommendations.push({
                title: "Add LICENSE",
                description: "A license defines how others can use and contribute to the project.",
                action: "Add an MIT or Apache-2.0 license file.",
                priority: "medium",
            });
        }
        return recommendations;
    }
    getDeploymentSuggestions(analysis) {
        const suggestions = [];
        if (analysis.framework === "Next.js" || analysis.framework === "React") {
            suggestions.push({
                platform: "Vercel",
                reason: "Strong default experience for frontend frameworks.",
                steps: ["Connect your GitHub repository", "Configure build settings", "Deploy"],
            });
        }
        if (analysis.language === "TypeScript/JavaScript" || analysis.language === "Python" || analysis.language === "Go") {
            suggestions.push({
                platform: "Railway / Fly.io",
                reason: "Good fit for app and API workloads with simple deployments.",
                steps: ["Install platform CLI", "Launch app", "Set environment variables"],
            });
        }
        if (analysis.hasDockerfile) {
            suggestions.push({
                platform: "Container-ready VPS",
                reason: "Your repo already has a Dockerfile and can run on any Docker host.",
                steps: ["Provision a VPS", "Install Docker", "Run image using Docker Compose or Docker run"],
            });
        }
        return suggestions;
    }
}
exports.RecommendationEngine = RecommendationEngine;
