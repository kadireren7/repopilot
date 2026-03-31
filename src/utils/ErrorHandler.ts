import chalk from "chalk";

export class RepoPilotError extends Error {
  constructor(public message: string, public code?: string, public hint?: string) {
    super(message);
    this.name = "RepoPilotError";
  }
}

export class ErrorHandler {
  static handle(error: unknown): void {
    if (error instanceof RepoPilotError) {
      console.error(chalk.red(`\nError: ${error.message}`));
      if (error.code) console.error(chalk.gray(`Code: ${error.code}`));
      if (error.hint) console.error(chalk.cyan(`Hint: ${error.hint}`));
      process.exit(1);
    }

    if (typeof error === "object" && error !== null && "status" in error) {
      const status = (error as any).status;
      const message = String((error as any).message ?? "");
      if (status === 401) {
        console.error(chalk.red("\nGitHub authentication failed."));
        console.error(chalk.cyan("Hint: set a valid GITHUB_TOKEN environment variable."));
        process.exit(1);
      }
      if (status === 404) {
        console.error(chalk.red("\nRepository not found or access denied."));
        console.error(chalk.cyan("Hint: verify owner/repo and token permissions."));
        process.exit(1);
      }
      if (status === 403 && message.toLowerCase().includes("rate limit")) {
        console.error(chalk.red("\nGitHub API rate limit exceeded."));
        console.error(chalk.cyan("Hint: retry later or use an authenticated token."));
        process.exit(1);
      }
    }

    console.error(chalk.red("\nUnexpected failure while running RepoPilot."));
    console.error(chalk.gray(String((error as any)?.message ?? error)));
    process.exit(1);
  }
}
