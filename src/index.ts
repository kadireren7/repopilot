#!/usr/bin/env node
import chalk from "chalk";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { RepoAnalyzer } from "./analyzers/RepoAnalyzer";
import { GeneratorEngine } from "./engines/GeneratorEngine";
import { PreviewEngine } from "./engines/PreviewEngine";
import { RecommendationEngine } from "./engines/RecommendationEngine";
import { ScoringEngine } from "./engines/ScoringEngine";
import { writeJsonReport } from "./reporting/JsonReportWriter";
import { writeSarifReport } from "./reporting/SarifReportWriter";
import { TerminalReporter } from "./reporting/TerminalReporter";
import { cloneShallow } from "./services/CloneService";
import { GitHubService } from "./services/GitHubService";
import { ConfigManager } from "./utils/ConfigManager";
import { ErrorHandler, RepoPilotError } from "./utils/ErrorHandler";
import { isRemoteRepositoryUrl } from "./utils/url";

type OutputFormat = "terminal" | "json" | "sarif";

async function resolveRepoPath(target: string): Promise<{ repoPath: string; cleanup?: () => Promise<void> }> {
  if (!isRemoteRepositoryUrl(target)) {
    return { repoPath: path.resolve(process.cwd(), target) };
  }
  const { path: clonePath, cleanup } = await cloneShallow(target);
  return { repoPath: clonePath, cleanup };
}

async function runAnalyze(target: string, format: OutputFormat): Promise<void> {
  const { repoPath, cleanup } = await resolveRepoPath(target);
  try {
    const config = await ConfigManager.load(repoPath);
    const analyzer = new RepoAnalyzer(repoPath);
    const analysis = await analyzer.analyze();
    const scoring = new ScoringEngine().calculate(analysis, config.weights);
    const recommendations = new RecommendationEngine().getRecommendations(analysis);
    const deploymentSuggestions = new RecommendationEngine().getDeploymentSuggestions(analysis);

    const report = { repoPath, analysis, score: scoring, recommendations, deploymentSuggestions };

    if (format === "json") {
      writeJsonReport(report);
    } else if (format === "sarif") {
      writeSarifReport(report);
    } else {
      new TerminalReporter().report(report);
    }
  } finally {
    await cleanup?.();
  }
}

async function runFix(
  target: string,
  dryRun: boolean,
  overwrite: boolean,
  options: { githubPr: boolean; token?: string; cleanup: boolean }
): Promise<void> {
  const remote = isRemoteRepositoryUrl(target);
  const { repoPath, cleanup } = await resolveRepoPath(target);

  try {
    const analysis = await new RepoAnalyzer(repoPath).analyze();
    const generated = new GeneratorEngine(analysis, repoPath).generateMissingFiles();
    const preview = new PreviewEngine();
    preview.showPreview(generated);

    if (options.githubPr) {
      if (!remote) {
        throw new RepoPilotError(
          "--github-pr is only valid when <target> is a remote git URL.",
          "GITHUB_PR_LOCAL_PATH",
          "Pass a https://github.com/org/repo URL or omit --github-pr for local paths."
        );
      }
      const token = options.token ?? process.env.GITHUB_TOKEN;
      if (!token) {
        throw new RepoPilotError(
          "GitHub token required for --github-pr.",
          "MISSING_GITHUB_TOKEN",
          "Set GITHUB_TOKEN or pass --token."
        );
      }
      let info: { owner: string; repo: string };
      try {
        info = new GitHubService(token).parseRepoUrl(target);
      } catch {
        throw new RepoPilotError(
          "Could not parse a GitHub repository from the URL.",
          "INVALID_GITHUB_URL",
          "Use https://github.com/org/repo or git@github.com:org/repo.git"
        );
      }

      if (dryRun) {
        console.log(chalk.yellow("\n[DRY-RUN] Would create a branch, commit generated files, and open a pull request.\n"));
        return;
      }

      if (generated.length === 0) {
        console.log(chalk.green("\nNothing to commit — repository already has the baseline files.\n"));
        return;
      }

      const gh = new GitHubService(token);
      const base = await gh.getDefaultBranch(info.owner, info.repo);
      const branchName = `repopilot/ship-readiness-${Date.now()}`;
      await gh.createBranch(info.owner, info.repo, branchName);
      await gh.commitFiles(info.owner, info.repo, branchName, generated);
      const prUrl = await gh.createPullRequest(info.owner, info.repo, branchName, base, generated);
      console.log(chalk.green(`\nPull request: ${prUrl}\n`));
      return;
    }

    await preview.writeFiles(generated, { targetPath: repoPath, dryRun, overwrite });

    if (remote) {
      console.log(chalk.cyan(`\nCloned repository path: ${repoPath}`));
      if (!dryRun && !options.cleanup) {
        console.log(chalk.gray("Tip: commit from that directory, or rerun with --cleanup to remove the temp clone.\n"));
      }
    }
  } finally {
    if (cleanup && (dryRun || options.cleanup)) {
      await cleanup();
    }
  }
}

void yargs(hideBin(process.argv))
  .scriptName("repopilot")
  .usage("$0 <command> [options]")
  .example("$0 analyze .", "Analyze a local repository and print readiness report")
  .example("$0 analyze https://github.com/org/repo --format json", "Analyze a remote clone (read-only) and print JSON")
  .example("$0 fix . --dry-run", "Preview generated infrastructure files without writing")
  .example("$0 fix https://github.com/org/repo --github-pr", "Open a PR with generated files (requires GITHUB_TOKEN)")
  .command(
    "analyze <target>",
    "Analyze a local path or remote git URL for ship-readiness",
    (cmd) =>
      cmd
        .positional("target", {
          type: "string",
          default: ".",
          describe: "Local repository path or git URL",
        })
        .option("format", {
          alias: "f",
          choices: ["terminal", "json", "sarif"] as const,
          default: "terminal" as const,
          describe: "Output format",
        }),
    async (argv) => {
      try {
        await runAnalyze(String(argv.target), argv.format as OutputFormat);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    }
  )
  .command(
    "fix <target>",
    "Generate missing infrastructure files (local path or remote URL)",
    (cmd) =>
      cmd
        .positional("target", {
          type: "string",
          default: ".",
          describe: "Local repository path or git URL",
        })
        .option("dry-run", {
          type: "boolean",
          default: false,
          describe: "Show files that would be generated without writing them",
        })
        .option("overwrite", {
          type: "boolean",
          default: false,
          describe: "Overwrite existing files if they already exist",
        })
        .option("github-pr", {
          type: "boolean",
          default: false,
          describe: "For GitHub URLs: commit generated files and open a pull request (requires token)",
        })
        .option("token", {
          type: "string",
          describe: "GitHub personal access token (or set GITHUB_TOKEN)",
        })
        .option("cleanup", {
          type: "boolean",
          default: false,
          describe: "After a remote fix, delete the temporary clone",
        }),
    async (argv) => {
      try {
        await runFix(String(argv.target), Boolean(argv.dryRun), Boolean(argv.overwrite), {
          githubPr: Boolean(argv.githubPr),
          token: argv.token ? String(argv.token) : undefined,
          cleanup: Boolean(argv.cleanup),
        });
      } catch (error) {
        ErrorHandler.handle(error);
      }
    }
  )
  .demandCommand(1, "Specify a command: analyze or fix")
  .strict()
  .help()
  .alias("h", "help")
  .wrap(110)
  .parse();
