import { execFile, type ExecFileException } from "node:child_process";
import { App } from "@octokit/app";
import { githubAppConfigured } from "@/lib/dev-auth";
import { redact } from "@/lib/redact";
import type { PullRequestClient } from "@/lib/publish-git";

function privateKey() {
  return (process.env.GITHUB_APP_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
}

export function githubApp(): App | null {
  if (!githubAppConfigured()) return null;
  return new App({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: privateKey(),
  });
}

export async function installationClient(installationId: number): Promise<PullRequestClient> {
  const app = githubApp();
  if (!app) {
    throw new Error("The GitHub connection is not configured yet.");
  }
  const octokit = await app.getInstallationOctokit(installationId);
  return {
    async createPullRequest(input) {
      try {
        const response = await octokit.request("POST /repos/{owner}/{repo}/pulls", {
          owner: input.owner,
          repo: input.repo,
          title: input.title,
          body: input.body,
          head: input.head,
          base: input.base,
        });
        return { url: response.data.html_url, number: response.data.number };
      } catch (error) {
        const message = error instanceof Error ? redact(error.message) : "GitHub could not open the review.";
        if (/merge conflict|not mergeable/i.test(message)) {
          throw new Error("Those changes conflict with newer work. A 4EOS designer needs to look at them.");
        }
        throw new Error("The review could not be opened. A 4EOS designer needs to look at the connection.");
      }
    },
  };
}

export async function pushBranch(options: {
  cwd: string;
  installationId: number;
  owner: string;
  repo: string;
  branch: string;
}) {
  const app = githubApp();
  if (!app) throw new Error("The GitHub connection is not configured yet.");
  const octokit = await app.getInstallationOctokit(options.installationId);
  const auth = (await octokit.auth({ type: "installation" })) as { token: string };
  const remote = `https://x-access-token:${auth.token}@github.com/${options.owner}/${options.repo}.git`;
  await new Promise<void>((resolve, reject) => {
    execFile(
      "git",
      ["push", "--no-force", remote, `HEAD:refs/heads/${options.branch}`],
      {
        cwd: options.cwd,
        env: { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: "development" },
      },
      (error: ExecFileException | null, _stdout: string, stderr: string) => {
        if (error) {
          const safe = redact(`${error.message}\n${stderr}`);
          if (/non-fast-forward|rejected/i.test(safe)) {
            reject(new Error("Someone else changed this draft. A 4EOS designer needs to reconcile it."));
            return;
          }
          reject(new Error("The changes could not be sent for review."));
          return;
        }
        resolve();
      },
    );
  });
}
