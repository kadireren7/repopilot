import { DeploymentSuggestion, Recommendation, RepoAnalysis } from "../types";

export class RecommendationEngine {
  getRecommendations(analysis: RepoAnalysis): Recommendation[] {
    const recommendations: Recommendation[] = [];
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
    if (!analysis.hasTests) {
      recommendations.push({
        title: "Add automated tests",
        description: "Tests reduce regressions and document expected behavior.",
        action: "Add a test runner and tests (e.g. Jest, Vitest, pytest, go test, cargo test).",
        priority: "high",
      });
    }
    if (!analysis.hasSecurityPolicy) {
      recommendations.push({
        title: "Add SECURITY.md",
        description: "A security policy tells reporters how to disclose vulnerabilities responsibly.",
        action: "Add SECURITY.md at the repo root with contact and disclosure guidelines.",
        priority: "medium",
      });
    }
    if (!analysis.hasContributing) {
      recommendations.push({
        title: "Add CONTRIBUTING.md",
        description: "Contribution guidelines help new contributors ship quality changes.",
        action: "Document branch strategy, coding standards, and PR process in CONTRIBUTING.md.",
        priority: "low",
      });
    }
    if (!analysis.hasChangelog) {
      recommendations.push({
        title: "Add CHANGELOG.md",
        description: "A changelog communicates user-facing changes between releases.",
        action: "Maintain CHANGELOG.md (or release notes) following Keep a Changelog style.",
        priority: "low",
      });
    }
    return recommendations;
  }

  getDeploymentSuggestions(analysis: RepoAnalysis): DeploymentSuggestion[] {
    const suggestions: DeploymentSuggestion[] = [];
    if (analysis.framework === "Next.js" || analysis.framework === "React") {
      suggestions.push({
        platform: "Vercel",
        reason: "Strong default experience for frontend frameworks.",
        steps: ["Connect your GitHub repository", "Configure build settings", "Deploy"],
      });
    }
    if (
      analysis.language === "TypeScript/JavaScript" ||
      analysis.language === "Python" ||
      analysis.language === "Go" ||
      analysis.language === "Rust"
    ) {
      suggestions.push({
        platform: "Railway / Fly.io",
        reason: "Good fit for app and API workloads with simple deployments.",
        steps: ["Install platform CLI", "Launch app", "Set environment variables"],
      });
    }
    if (analysis.language === "Java") {
      suggestions.push({
        platform: "Kubernetes / Cloud JVM",
        reason: "JVM services often ship as containers or fat JARs behind a platform load balancer.",
        steps: ["Build with Maven/Gradle", "Containerize or package JAR", "Configure health checks"],
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
