"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneShallow = cloneShallow;
const child_process_1 = require("child_process");
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const crypto_1 = require("crypto");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
async function cloneShallow(repoUrl) {
    const dir = path_1.default.join(os_1.default.tmpdir(), `repopilot-${(0, crypto_1.randomUUID)()}`);
    await fs_extra_1.default.ensureDir(dir);
    const cloneTarget = path_1.default.join(dir, "repo");
    try {
        await execFileAsync("git", ["clone", "--depth", "1", repoUrl, cloneTarget], {
            maxBuffer: 10 * 1024 * 1024,
        });
    }
    catch (e) {
        await fs_extra_1.default.remove(dir).catch(() => { });
        throw new Error(`git clone failed: ${String(e?.message ?? e)}. Ensure git is installed and the URL is accessible.`);
    }
    const cleanup = async () => {
        await fs_extra_1.default.remove(dir).catch(() => { });
    };
    return { path: cloneTarget, cleanup };
}
