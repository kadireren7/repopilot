import { execFile } from "child_process";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

export interface CloneResult {
  path: string;
  cleanup: () => Promise<void>;
}

export async function cloneShallow(repoUrl: string): Promise<CloneResult> {
  const dir = path.join(os.tmpdir(), `repopilot-${randomUUID()}`);
  await fs.ensureDir(dir);
  const cloneTarget = path.join(dir, "repo");
  try {
    await execFileAsync("git", ["clone", "--depth", "1", repoUrl, cloneTarget], {
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (e: any) {
    await fs.remove(dir).catch(() => {});
    throw new Error(
      `git clone failed: ${String(e?.message ?? e)}. Ensure git is installed and the URL is accessible.`
    );
  }

  const cleanup = async (): Promise<void> => {
    await fs.remove(dir).catch(() => {});
  };

  return { path: cloneTarget, cleanup };
}
