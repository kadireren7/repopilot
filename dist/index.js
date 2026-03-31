#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const RepoAnalyzer_1 = require("./analyzers/RepoAnalyzer");
const GeneratorEngine_1 = require("./engines/GeneratorEngine");
const PreviewEngine_1 = require("./engines/PreviewEngine");
const RecommendationEngine_1 = require("./engines/RecommendationEngine");
const ScoringEngine_1 = require("./engines/ScoringEngine");
const TerminalReporter_1 = require("./reporting/TerminalReporter");
const ErrorHandler_1 = require("./utils/ErrorHandler");
async function runAnalyze(target) {
    if (target.startsWith("http://") || target.startsWith("https://")) {
        throw new ErrorHandler_1.RepoPilotError("Remote URL analysis is not available in this release.", "REMOTE_ANALYZE_UNSUPPORTED", "Clone the repository locally and run: repopilot analyze <local-path>");
    }
    const repoPath = path_1.default.resolve(process.cwd(), target);
    const analyzer = new RepoAnalyzer_1.RepoAnalyzer(repoPath);
    const analysis = await analyzer.analyze();
    const scoring = new ScoringEngine_1.ScoringEngine().calculate(analysis);
    const recommendations = new RecommendationEngine_1.RecommendationEngine().getRecommendations(analysis);
    const deploymentSuggestions = new RecommendationEngine_1.RecommendationEngine().getDeploymentSuggestions(analysis);
    new TerminalReporter_1.TerminalReporter().report({
        repoPath,
        analysis,
        score: scoring,
        recommendations,
        deploymentSuggestions,
    });
}
async function runFix(target, dryRun, overwrite) {
    if (target.startsWith("http://") || target.startsWith("https://")) {
        throw new ErrorHandler_1.RepoPilotError("Remote fix is not available in this release.", "REMOTE_FIX_UNSUPPORTED", "Use a local repository path and rerun with --dry-run first.");
    }
    const repoPath = path_1.default.resolve(process.cwd(), target);
    const analysis = await new RepoAnalyzer_1.RepoAnalyzer(repoPath).analyze();
    const generated = new GeneratorEngine_1.GeneratorEngine(analysis, repoPath).generateMissingFiles();
    const preview = new PreviewEngine_1.PreviewEngine();
    preview.showPreview(generated);
    await preview.writeFiles(generated, { targetPath: repoPath, dryRun, overwrite });
}
void (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .scriptName("repopilot")
    .usage("$0 <command> [options]")
    .example("$0 analyze .", "Analyze a local repository and print readiness report")
    .example("$0 fix . --dry-run", "Preview generated infrastructure files without writing")
    .command("analyze <target>", "Analyze a local repository for ship-readiness", (cmd) => cmd.positional("target", {
    type: "string",
    describe: "Local repository path",
}), async (argv) => {
    try {
        await runAnalyze(String(argv.target));
    }
    catch (error) {
        ErrorHandler_1.ErrorHandler.handle(error);
    }
})
    .command("fix <target>", "Generate missing infrastructure files", (cmd) => cmd
    .positional("target", {
    type: "string",
    describe: "Local repository path",
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
}), async (argv) => {
    try {
        await runFix(String(argv.target), Boolean(argv.dryRun), Boolean(argv.overwrite));
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
