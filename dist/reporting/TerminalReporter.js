"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalReporter = void 0;
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
class TerminalReporter {
    report(data) {
        const scoreColor = this.getScoreColor(data.score.totalScore);
        console.log(chalk_1.default.bold.cyan("\nRepoPilot Report"));
        console.log(chalk_1.default.gray("────────────────────────────────────────"));
        console.log(`${chalk_1.default.bold("Repository:")} ${data.repoPath}`);
        console.log(`${chalk_1.default.bold("Ship Readiness:")} ${scoreColor(`${data.score.totalScore}/100`)}`);
        console.log(chalk_1.default.italic(data.score.summary));
        console.log("");
        const table = new cli_table3_1.default({
            head: [chalk_1.default.blue("Category"), chalk_1.default.blue("Score"), chalk_1.default.blue("Issues")],
            colWidths: [18, 10, 70],
            wordWrap: true,
        });
        Object.entries(data.score.categories).forEach(([name, cat]) => {
            table.push([
                name.charAt(0).toUpperCase() + name.slice(1),
                `${cat.score}/${cat.maxScore}`,
                cat.issues.length ? cat.issues.join("\n") : chalk_1.default.green("No issues"),
            ]);
        });
        console.log(table.toString());
        if (data.recommendations.length) {
            console.log(chalk_1.default.bold.yellow("\nRecommended actions"));
            for (const [i, rec] of data.recommendations.entries()) {
                const p = rec.priority.toUpperCase();
                const priorityColor = rec.priority === "high" ? chalk_1.default.red : rec.priority === "medium" ? chalk_1.default.yellow : chalk_1.default.blue;
                console.log(`${i + 1}. ${chalk_1.default.bold(rec.title)} ${priorityColor(`[${p}]`)}`);
                console.log(`   ${rec.description}`);
                console.log(`   ${chalk_1.default.green("Action:")} ${rec.action}`);
            }
        }
        if (data.deploymentSuggestions.length) {
            console.log(chalk_1.default.bold.magenta("\nDeployment suggestions"));
            for (const [i, sug] of data.deploymentSuggestions.entries()) {
                console.log(`${i + 1}. ${chalk_1.default.bold(sug.platform)}`);
                console.log(`   ${chalk_1.default.gray("Reason:")} ${sug.reason}`);
                console.log(`   ${chalk_1.default.gray("Steps:")} ${sug.steps.join(" -> ")}`);
            }
        }
        console.log("");
    }
    getScoreColor(score) {
        if (score >= 90)
            return chalk_1.default.green;
        if (score >= 70)
            return chalk_1.default.yellow;
        if (score >= 50)
            return chalk_1.default.hex("#FFA500");
        return chalk_1.default.red;
    }
}
exports.TerminalReporter = TerminalReporter;
