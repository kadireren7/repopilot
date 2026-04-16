"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeJsonReport = writeJsonReport;
function writeJsonReport(report) {
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
