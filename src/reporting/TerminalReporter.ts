import chalk from "chalk";
import Table from "cli-table3";
import { AnalysisReport } from "../types";

export class TerminalReporter {
  report(data: AnalysisReport): void {
    const scoreColor = this.getScoreColor(data.score.totalScore);
    console.log(chalk.bold.cyan("\nRepoPilot Report"));
    console.log(chalk.gray("────────────────────────────────────────"));
    console.log(`${chalk.bold("Repository:")} ${data.repoPath}`);
    console.log(`${chalk.bold("Ship Readiness:")} ${scoreColor(`${data.score.totalScore}/100`)}`);
    console.log(chalk.italic(data.score.summary));
    console.log("");

    const table = new Table({
      head: [chalk.blue("Category"), chalk.blue("Score"), chalk.blue("Issues")],
      colWidths: [18, 10, 70],
      wordWrap: true,
    });

    Object.entries(data.score.categories).forEach(([name, cat]) => {
      table.push([
        name.charAt(0).toUpperCase() + name.slice(1),
        `${cat.score}/${cat.maxScore}`,
        cat.issues.length ? cat.issues.join("\n") : chalk.green("No issues"),
      ]);
    });
    console.log(table.toString());

    if (data.recommendations.length) {
      console.log(chalk.bold.yellow("\nRecommended actions"));
      for (const [i, rec] of data.recommendations.entries()) {
        const p = rec.priority.toUpperCase();
        const priorityColor = rec.priority === "high" ? chalk.red : rec.priority === "medium" ? chalk.yellow : chalk.blue;
        console.log(`${i + 1}. ${chalk.bold(rec.title)} ${priorityColor(`[${p}]`)}`);
        console.log(`   ${rec.description}`);
        console.log(`   ${chalk.green("Action:")} ${rec.action}`);
      }
    }

    if (data.deploymentSuggestions.length) {
      console.log(chalk.bold.magenta("\nDeployment suggestions"));
      for (const [i, sug] of data.deploymentSuggestions.entries()) {
        console.log(`${i + 1}. ${chalk.bold(sug.platform)}`);
        console.log(`   ${chalk.gray("Reason:")} ${sug.reason}`);
        console.log(`   ${chalk.gray("Steps:")} ${sug.steps.join(" -> ")}`);
      }
    }
    console.log("");
  }

  private getScoreColor(score: number) {
    if (score >= 90) return chalk.green;
    if (score >= 70) return chalk.yellow;
    if (score >= 50) return chalk.hex("#FFA500");
    return chalk.red;
  }
}
