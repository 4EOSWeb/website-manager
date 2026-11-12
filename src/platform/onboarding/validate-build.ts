import { execFile } from "node:child_process";
import path from "node:path";
import { redact } from "../../lib/redact";

export type BuildRun = {
  command: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
};

export type BuildRunner = (input: BuildRun) => Promise<{ code: number; log: string }>;

const logs = new Map<string, string>();

function buildEnv(): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    TMPDIR: process.env.TMPDIR,
    NODE_ENV: "production",
  };
}

function tail(log: string) {
  const redacted = redact(log);
  const lines = redacted.split(/\r?\n/).slice(-50).join("\n");
  if (/gh[pousr]_|github_pat_|-----BEGIN |x-access-token:(?!\[redacted\])/.test(lines)) return "";
  return lines;
}

export function storedBuildLog(cwd: string) {
  return logs.get(path.resolve(cwd)) ?? "";
}

function runPackageScript(input: BuildRun) {
  const match = /^(npm|pnpm|yarn) run ([A-Za-z0-9:_-]+)$/.exec(input.command.trim());
  if (!match) return Promise.resolve({ code: 1, log: "The build command is not a package script." });
  const [manager, script] = [match[1], match[2]];
  return new Promise<{ code: number; log: string }>((resolve) => {
    execFile(manager, ["run", script], { cwd: input.cwd, env: input.env, timeout: input.timeoutMs }, (error, stdout, stderr) => {
      const log = `${stdout ?? ""}\n${stderr ?? ""}`;
      if (!error) {
        resolve({ code: 0, log });
        return;
      }
      const code = typeof error.code === "number" ? error.code : 1;
      resolve({ code, log });
    });
  });
}

/** Runs the site build. EDITOR_PREVIEW is not set. The stored log is redacted. */
export async function validateOnboardingBuild(input: { command: string; cwd: string; run?: BuildRunner; timeoutMs?: number }) {
  const run = input.run ?? runPackageScript;
  const env = buildEnv();
  const result = await run({ command: input.command, cwd: input.cwd, env, timeoutMs: input.timeoutMs ?? 180_000 });
  const log = tail(result.log);
  logs.set(path.resolve(input.cwd), log);
  if (result.code !== 0) return { ok: false as const, problem: "The production build failed.", log };
  return { ok: true as const, log };
}
