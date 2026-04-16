import { AnalysisReport } from "../types";

export function writeJsonReport(report: AnalysisReport): void {
  const payload = {
    version: 1,
    repoPath: report.repoPath,
    analysis: report.analysis,
    score: report.score,
    recommendations: report.recommendations,
    deploymentSuggestions: report.deploymentSuggestions,
  };
  console.log(JSON.stringify(payload, null, 2));
}
