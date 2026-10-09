import { spawn, type ChildProcess } from "node:child_process";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { promisify } from "node:util";
import { redact } from "@/lib/redact";

const exec = promisify(execFile);

type Preview = {
  port: number;
  token: string;
  dir: string;
  process: ChildProcess;
};

const previews = new Map<string, Preview>();
const overlayRoot = path.join(process.cwd(), "overlays", "quantum-age");

function workspaceDir(websiteId: string) {
  if (!/^[a-z0-9_-]+$/i.test(websiteId)) throw new Error("Unknown website.");
  return path.join(process.cwd(), ".workspaces", websiteId);
}

function safeEnv(extra: Record<string, string>): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    NODE_ENV: "development",
    ...extra,
  };
}

function copyOverlay(destination: string) {
  const entries = walk(overlayRoot);
  for (const file of entries) {
    const relative = path.relative(overlayRoot, file);
    const target = path.join(destination, relative);
    // Draft content is written after the overlay. Do not put the template copy back on top of it.
    const isDraftContent =
      relative === "src/content/pages/home.json" ||
      relative === "src/content/editor/site.json" ||
      relative.startsWith("src/content/blog/") ||
      relative.startsWith("public/media/");
    if (isDraftContent && fs.existsSync(target)) continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
  }
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

export async function ensureWorkspace(websiteId: string) {
  const dir = workspaceDir(websiteId);
  if (!fs.existsSync(path.join(dir, ".git"))) {
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    const source = process.env.SITE_SOURCE_DIR;
    if (source && fs.existsSync(path.join(source, ".git"))) {
      await exec("git", ["clone", "--local", source, dir]);
    } else {
      await exec("git", ["clone", "--depth", "1", "https://github.com/4EOSWeb/quantum-age.git", dir]);
    }
  }
  copyOverlay(dir);
  if (!fs.existsSync(path.join(dir, "node_modules", "next"))) {
    await exec("npm", ["ci"], { cwd: dir, env: safeEnv({}) });
  }
  return dir;
}

export function writePreviewContent(dir: string, files: { relativePath: string; contents: string | Buffer }[]) {
  for (const file of files) {
    if (file.relativePath.includes("..")) throw new Error("That file cannot be saved.");
    const target = path.join(dir, file.relativePath);
    const resolved = path.resolve(target);
    if (!resolved.startsWith(path.resolve(dir) + path.sep)) throw new Error("That file cannot be saved.");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.contents);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function portInUse(port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    const done = (open: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.setTimeout(500, () => done(false));
  });
}

async function previewAnswers(port: number, token: string) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, {
      headers: { "x-4eos-preview": token },
      redirect: "manual",
      signal: AbortSignal.timeout(2000),
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

function lockPid(dir: string) {
  try {
    const lock = JSON.parse(fs.readFileSync(path.join(dir, ".next", "dev", "lock"), "utf8")) as { pid?: number };
    return typeof lock.pid === "number" ? lock.pid : null;
  } catch {
    return null;
  }
}

async function stopProcess(pid: number) {
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return;
  }
  await sleep(400);
  try {
    process.kill(pid, 0);
    process.kill(pid, "SIGKILL");
  } catch {
    // The process has already exited.
  }
}

async function waitForPort(port: number, free: boolean) {
  const started = Date.now();
  while (Date.now() - started < 10_000) {
    if ((await portInUse(port)) !== free) return;
    await sleep(200);
  }
}

async function waitForPreview(port: number, token: string, child: ChildProcess) {
  const started = Date.now();
  while (Date.now() - started < 90_000) {
    if (child.exitCode !== null) {
      throw new Error("The website preview stopped before it was ready.");
    }
    if (await previewAnswers(port, token)) return;
    await sleep(500);
  }
  throw new Error("The website preview did not start. Please try again in a moment.");
}

function nextPort() {
  const used = new Set([...previews.values()].map((preview) => preview.port));
  let port = 4600;
  while (used.has(port)) port += 1;
  return port;
}

export async function startPreview(websiteId: string) {
  const current = previews.get(websiteId);
  if (current && current.process.exitCode === null && (await previewAnswers(current.port, current.token))) {
    return current;
  }
  if (current) {
    current.process.kill("SIGTERM");
    previews.delete(websiteId);
  }
  const dir = await ensureWorkspace(websiteId);
  const stale = lockPid(dir);
  if (stale && stale !== process.pid) await stopProcess(stale);
  const port = nextPort();
  await waitForPort(port, true);
  if (await portInUse(port)) {
    throw new Error("The website preview port is still busy.");
  }
  const token = randomBytes(24).toString("hex");
  const child = spawn("npm", ["run", "dev", "--", "--port", String(port), "--hostname", "127.0.0.1"], {
    cwd: dir,
    env: safeEnv({
      EDITOR_PREVIEW: "1",
      EDITOR_PREVIEW_TOKEN: token,
      EDITOR_HUB_ORIGIN: process.env.AUTH_URL ?? "http://127.0.0.1:3210",
    }),
    stdio: ["ignore", "pipe", "pipe"],
  });
  const log = (chunk: Buffer) => {
    const line = redact(chunk.toString()).trim();
    if (line) console.info(`[preview ${websiteId}] ${line.slice(0, 400)}`);
  };
  child.stdout?.on("data", log);
  child.stderr?.on("data", log);
  const preview = { port, token, dir, process: child };
  previews.set(websiteId, preview);
  try {
    await waitForPreview(port, token, child);
  } catch (error) {
    child.kill("SIGTERM");
    previews.delete(websiteId);
    throw error;
  }
  return preview;
}

export function previewFor(websiteId: string) {
  return previews.get(websiteId) ?? null;
}

export function stopPreview(websiteId: string) {
  const current = previews.get(websiteId);
  if (!current) return;
  current.process.kill("SIGTERM");
  previews.delete(websiteId);
}
