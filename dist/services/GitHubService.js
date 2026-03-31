"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const chalk_1 = __importDefault(require("chalk"));
const octokit_1 = require("octokit");
class GitHubService {
    constructor(token) {
        this.octokit = new octokit_1.Octokit({ auth: token });
    }
    parseRepoUrl(url) {
        const parts = url.replace("https://github.com/", "").split("/");
        if (parts.length < 2)
            throw new Error("Invalid GitHub repository URL.");
        return { owner: parts[0], repo: parts[1].replace(".git", "") };
    }
    async createBranch(owner, repo, branchName) {
        try {
            const { data: mainBranch } = await this.octokit.rest.repos
                .getBranch({ owner, repo, branch: "main" })
                .catch(() => this.octokit.rest.repos.getBranch({ owner, repo, branch: "master" }));
            await this.octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branchName}`, sha: mainBranch.commit.sha });
            console.log(chalk_1.default.green(`[GITHUB] Created branch: ${branchName}`));
        }
        catch (error) {
            if (error.status === 422)
                console.log(chalk_1.default.yellow(`[GITHUB] Branch ${branchName} already exists.`));
            else
                throw error;
        }
    }
    async commitFiles(owner, repo, branch, files) {
        for (const file of files) {
            try {
                let sha;
                try {
                    const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path: file.path, ref: branch });
                    if (!Array.isArray(data))
                        sha = data.sha;
                }
                catch { }
                await this.octokit.rest.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path: file.path,
                    message: `chore: add ${file.path} via RepoPilot`,
                    content: Buffer.from(file.content).toString("base64"),
                    branch,
                    sha,
                });
                console.log(chalk_1.default.green(`[GITHUB] Committed: ${file.path}`));
            }
            catch (error) {
                console.error(chalk_1.default.red(`[GITHUB] Failed to commit ${file.path}: ${String(error)}`));
            }
        }
    }
    async createPullRequest(owner, repo, head, files) {
        const body = `
## RepoPilot Ship Readiness Fixes

This PR was generated automatically by RepoPilot.

### Applied changes
${files.map((f) => `- **${f.path}**: ${f.description}`).join("\n")}
`;
        const { data: pr } = await this.octokit.rest.pulls.create({
            owner,
            repo,
            title: "chore: improve ship readiness with RepoPilot",
            head,
            base: "main",
            body,
        });
        return pr.html_url;
    }
}
exports.GitHubService = GitHubService;
