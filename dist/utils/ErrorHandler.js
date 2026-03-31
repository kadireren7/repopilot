"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.RepoPilotError = void 0;
const chalk_1 = __importDefault(require("chalk"));
class RepoPilotError extends Error {
    constructor(message, code, hint) {
        super(message);
        this.message = message;
        this.code = code;
        this.hint = hint;
        this.name = "RepoPilotError";
    }
}
exports.RepoPilotError = RepoPilotError;
class ErrorHandler {
    static handle(error) {
        if (error instanceof RepoPilotError) {
            console.error(chalk_1.default.red(`\nError: ${error.message}`));
            if (error.code)
                console.error(chalk_1.default.gray(`Code: ${error.code}`));
            if (error.hint)
                console.error(chalk_1.default.cyan(`Hint: ${error.hint}`));
            process.exit(1);
        }
        if (typeof error === "object" && error !== null && "status" in error) {
            const status = error.status;
            const message = String(error.message ?? "");
            if (status === 401) {
                console.error(chalk_1.default.red("\nGitHub authentication failed."));
                console.error(chalk_1.default.cyan("Hint: set a valid GITHUB_TOKEN environment variable."));
                process.exit(1);
            }
            if (status === 404) {
                console.error(chalk_1.default.red("\nRepository not found or access denied."));
                console.error(chalk_1.default.cyan("Hint: verify owner/repo and token permissions."));
                process.exit(1);
            }
            if (status === 403 && message.toLowerCase().includes("rate limit")) {
                console.error(chalk_1.default.red("\nGitHub API rate limit exceeded."));
                console.error(chalk_1.default.cyan("Hint: retry later or use an authenticated token."));
                process.exit(1);
            }
        }
        console.error(chalk_1.default.red("\nUnexpected failure while running RepoPilot."));
        console.error(chalk_1.default.gray(String(error?.message ?? error)));
        process.exit(1);
    }
}
exports.ErrorHandler = ErrorHandler;
