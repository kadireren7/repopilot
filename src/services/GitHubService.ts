import chalk from "chalk";
import { Octokit } from "octokit";
import { GeneratedFile } from "../types/generation";

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  parseRepoUrl(url: string): GitHubRepoInfo {
    let normalized = url.trim();
    if (normalized.startsWith("git@github.com:")) {
      normalized = `https://github.com/${normalized.replace("git@github.com:", "")}`;
    }
    const withoutScheme = normalized.replace(/^https?:\/\/github\.com\//i, "");
    const parts = withoutScheme.split("/").filter(Boolean);
    if (parts.length < 2) throw new Error("Invalid GitHub repository URL.");
    return { owner: parts[0]!, repo: parts[1]!.replace(/\.git$/i, "") };
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const { data } = await this.octokit.rest.repos.get({ owner, repo });
    return data.default_branch;
  }

  async createBranch(owner: string, repo: string, branchName: string): Promise<void> {
    try {
      const base = await this.getDefaultBranch(owner, repo);
      const { data: mainBranch } = await this.octokit.rest.repos.getBranch({ owner, repo, branch: base });

      await this.octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branchName}`, sha: mainBranch.commit.sha });
      console.log(chalk.green(`[GITHUB] Created branch: ${branchName}`));
    } catch (error: any) {
      if (error.status === 422) console.log(chalk.yellow(`[GITHUB] Branch ${branchName} already exists.`));
      else throw error;
    }
  }

  async commitFiles(owner: string, repo: string, branch: string, files: GeneratedFile[]): Promise<void> {
    for (const file of files) {
      try {
        let sha: string | undefined;
        try {
          const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path: file.path, ref: branch });
          if (!Array.isArray(data)) sha = data.sha;
        } catch {}

        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: file.path,
          message: `chore: add ${file.path} via RepoPilot`,
          content: Buffer.from(file.content).toString("base64"),
          branch,
          sha,
        });
        console.log(chalk.green(`[GITHUB] Committed: ${file.path}`));
      } catch (error) {
        console.error(chalk.red(`[GITHUB] Failed to commit ${file.path}: ${String(error)}`));
      }
    }
  }

  async createPullRequest(owner: string, repo: string, head: string, base: string, files: GeneratedFile[]): Promise<string> {
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
      base,
      body,
    });

    return pr.html_url;
  }
}
