import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const ADAPTER_FILES = new Set([
  "4eos.editor.config.json",
  "4eos.editor.config.ts",
  "src/middleware.ts",
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/insights/page.tsx",
  "src/app/insights/[slug]/page.tsx",
  "src/components/site/hero-content-image.tsx",
  "src/components/site/editor-preview-script.tsx",
  "src/components/site/structured-article.tsx",
  "src/lib/structured-posts.ts",
  "src/content/pages/home.json",
]);

export function assertAllowedPath(filePath: string) {
  if (filePath.includes("..") || filePath.startsWith("/") || filePath.includes("\\")) {
    throw new Error("That file cannot be saved.");
  }
  const content =
    filePath.startsWith("src/content/blog/") && filePath.endsWith(".json") ||
    filePath.startsWith("public/media/") && /\.(png|jpe?g|webp)$/i.test(filePath);
  if (!ADAPTER_FILES.has(filePath) && !content) throw new Error("That file cannot be saved.");
}

export function assertBranchName(branch: string) {
  if (!/^editor\/[a-z0-9-]+\/[a-z0-9]{6,16}$/.test(branch)) {
    throw new Error("The editing branch name is not valid.");
  }
}

async function git(cwd: string, args: string[]) {
  const result = await exec("git", args, { cwd, env: gitEnv() });
  return result.stdout.trim();
}

function gitEnv(): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    NODE_ENV: "development",
    GIT_AUTHOR_NAME: "4EOS Website Editor",
    GIT_AUTHOR_EMAIL: "editor@4eos.test",
    GIT_COMMITTER_NAME: "4EOS Website Editor",
    GIT_COMMITTER_EMAIL: "editor@4eos.test",
  };
}

export async function currentCommit(cwd: string) {
  return git(cwd, ["rev-parse", "HEAD"]);
}

export async function commitAllowedChanges(options: {
  cwd: string;
  branch: string;
  files: string[];
  message: string;
}) {
  assertBranchName(options.branch);
  for (const file of options.files) assertAllowedPath(file);
  if (options.message.includes("\n") || options.message.length > 200) {
    throw new Error("The commit message is not valid.");
  }
  const base = await currentCommit(options.cwd);
  await git(options.cwd, ["checkout", "-B", options.branch, "HEAD"]);
  await git(options.cwd, ["add", "--", ...options.files]);
  const staged = await git(options.cwd, ["diff", "--cached", "--name-only"]);
  if (!staged) {
    return { commitSha: null as string | null, base, changed: [] as string[] };
  }
  await git(options.cwd, ["commit", "-m", options.message]);
  const commitSha = await currentCommit(options.cwd);
  const changed = staged.split("\n").filter(Boolean);
  const main = await git(options.cwd, ["rev-parse", "main"]);
  if (main !== base && (await git(options.cwd, ["rev-parse", "--abbrev-ref", "HEAD"])) === "main") {
    throw new Error("The production branch was not supposed to move.");
  }
  return { commitSha, base, changed };
}

export type PullRequestClient = {
  createPullRequest(input: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
  }): Promise<{ url: string; number: number }>;
};

export async function openPullRequest(
  client: PullRequestClient,
  input: { owner: string; repo: string; title: string; body: string; head: string; base: string },
) {
  if (input.head === input.base || input.head === "main" || input.head === "master") {
    throw new Error("Refusing to open a pull request from the production branch.");
  }
  assertBranchName(input.head);
  return client.createPullRequest(input);
}
