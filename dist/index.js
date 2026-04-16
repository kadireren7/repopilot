#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const RepoAnalyzer_1 = require("./analyzers/RepoAnalyzer");
const GeneratorEngine_1 = require("./engines/GeneratorEngine");
const PreviewEngine_1 = require("./engines/PreviewEngine");
const RecommendationEngine_1 = require("./engines/RecommendationEngine");
const ScoringEngine_1 = require("./engines/ScoringEngine");
const JsonReportWriter_1 = require("./reporting/JsonReportWriter");
const SarifReportWriter_1 = require("./reporting/SarifReportWriter");
const TerminalReporter_1 = require("./reporting/TerminalReporter");
const CloneService_1 = require("./services/CloneService");
const GitHubService_1 = require("./services/GitHubService");
const ConfigManager_1 = require("./utils/ConfigManager");
const ErrorHandler_1 = require("./utils/ErrorHandler");
const url_1 = require("./utils/url");
async function resolveRepoPath(target) {
    if (!(0, url_1.isRemoteRepositoryUrl)(target)) {
        return { repoPath: path_1.default.resolve(process.cwd(), target) };
    }
    const { path: clonePath, cleanup } = await (0, CloneService_1.cloneShallow)(target);
    return { repoPath: clonePath, cleanup };
}
async function runAnalyze(target, format) {
    const { repoPath, cleanup } = await resolveRepoPath(target);
    try {
        const config = await ConfigManager_1.ConfigManager.load(repoPath);
        const analyzer = new RepoAnalyzer_1.RepoAnalyzer(repoPath);
        const analysis = await analyzer.analyze();
        const scoring = new ScoringEngine_1.ScoringEngine().calculate(analysis, config.weights);
        const recommendations = new RecommendationEngine_1.RecommendationEngine().getRecommendations(analysis);
        const deploymentSuggestions = new RecommendationEngine_1.RecommendationEngine().getDeploymentSuggestions(analysis);
        const report = { repoPath, analysis, score: scoring, recommendations, deploymentSuggestions };
        if (format === "json") {
            (0, JsonReportWriter_1.writeJsonReport)(report);
        }
        else if (format === "sarif") {
            (0, SarifReportWriter_1.writeSarifReport)(report);
        }
        else {
            new TerminalReporter_1.TerminalReporter().report(report);
        }
    }
    finally {
        await cleanup?.();
    }
}
async function runFix(target, dryRun, overwrite, options) {
    const remote = (0, url_1.isRemoteRepositoryUrl)(target);
    const { repoPath, cleanup } = await resolveRepoPath(target);
    try {
        const analysis = await new RepoAnalyzer_1.RepoAnalyzer(repoPath).analyze();
        const generated = new GeneratorEngine_1.GeneratorEngine(analysis, repoPath).generateMissingFiles();
        const preview = new PreviewEngine_1.PreviewEngine();
        preview.showPreview(generated);
        if (options.githubPr) {
            if (!remote) {
                throw new ErrorHandler_1.RepoPilotError("--github-pr is only valid when <target> is a remote git URL.", "GITHUB_PR_LOCAL_PATH", "Pass a https://github.com/org/repo URL or omit --github-pr for local paths.");
            }
            const token = options.token ?? process.env.GITHUB_TOKEN;
            if (!token) {
                throw new ErrorHandler_1.RepoPilotError("GitHub token required for --github-pr.", "MISSING_GITHUB_TOKEN", "Set GITHUB_TOKEN or pass --token.");
            }
            let info;
            try {
                info = new GitHubService_1.GitHubService(token).parseRepoUrl(target);
            }
            catch {
                throw new ErrorHandler_1.RepoPilotError("Could not parse a GitHub repository from the URL.", "INVALID_GITHUB_URL", "Use https://github.com/org/repo or git@github.com:org/repo.git");
            }
            if (dryRun) {
                console.log(chalk_1.default.yellow("\n[DRY-RUN] Would create a branch, commit generated files, and open a pull request.\n"));
                return;
            }
            if (generated.length === 0) {
                console.log(chalk_1.default.green("\nNothing to commit — repository already has the baseline files.\n"));
                return;
            }
            const gh = new GitHubService_1.GitHubService(token);
            const base = await gh.getDefaultBranch(info.owner, info.repo);
            const branchName = `repopilot/ship-readiness-${Date.now()}`;
            await gh.createBranch(info.owner, info.repo, branchName);
            await gh.commitFiles(info.owner, info.repo, branchName, generated);
            const prUrl = await gh.createPullRequest(info.owner, info.repo, branchName, base, generated);
            console.log(chalk_1.default.green(`\nPull request: ${prUrl}\n`));
            return;
        }
        await preview.writeFiles(generated, { targetPath: repoPath, dryRun, overwrite });
        if (remote) {
            console.log(chalk_1.default.cyan(`\nCloned repository path: ${repoPath}`));
            if (!dryRun && !options.cleanup) {
                console.log(chalk_1.default.gray("Tip: commit from that directory, or rerun with --cleanup to remove the temp clone.\n"));
            }
        }
    }
    finally {
        if (cleanup && (dryRun || options.cleanup)) {
            await cleanup();
        }
    }
}
void (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .scriptName("repopilot")
    .usage("$0 <command> [options]")
    .example("$0 analyze .", "Analyze a local repository and print readiness report")
    .example("$0 analyze https://github.com/org/repo --format json", "Analyze a remote clone (read-only) and print JSON")
    .example("$0 fix . --dry-run", "Preview generated infrastructure files without writing")
    .example("$0 fix https://github.com/org/repo --github-pr", "Open a PR with generated files (requires GITHUB_TOKEN)")
    .command("analyze <target>", "Analyze a local path or remote git URL for ship-readiness", (cmd) => cmd
    .positional("target", {
    type: "string",
    default: ".",
    describe: "Local repository path or git URL",
})
    .option("format", {
    alias: "f",
    choices: ["terminal", "json", "sarif"],
    default: "terminal",
    describe: "Output format",
}), async (argv) => {
    try {
        await runAnalyze(String(argv.target), argv.format);
    }
    catch (error) {
        ErrorHandler_1.ErrorHandler.handle(error);
    }
})
    .command("fix <target>", "Generate missing infrastructure files (local path or remote URL)", (cmd) => cmd
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
}), async (argv) => {
    try {
        await runFix(String(argv.target), Boolean(argv.dryRun), Boolean(argv.overwrite), {
            githubPr: Boolean(argv.githubPr),
            token: argv.token ? String(argv.token) : undefined,
            cleanup: Boolean(argv.cleanup),
        });
    }
    catch (error) {
        ErrorHandler_1.ErrorHandler.handle(error);
    }
})
    .demandCommand(1, "Specify a command: analyze or fix")
    .strict()
    .help()
    .alias("h", "help")
    .wrap(110)
    .parse();
