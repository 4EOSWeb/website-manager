import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { can, landingPath, permissionsFor } from "../src/lib/roles.ts";
import { assertAllowedPath, commitAllowedChanges, openPullRequest } from "../src/lib/publish-git.ts";
import { rewritePreviewBody } from "../src/lib/preview-proxy.ts";
import { sniffImage } from "../src/lib/images.ts";
import { COPPER_TEST_IMAGE, defaultHomeDraft, placementSchema } from "../src/lib/content-schema.ts";

const exec = promisify(execFile);

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(landingPath(1, "web_quantum_age") === "/sites/web_quantum_age/editor", "one website opens the editor");
assert(landingPath(2) === "/sites", "several websites open the chooser");
assert(can(permissionsFor(null, "CLIENT_EDITOR"), "draft.save"), "editor can save");
assert(!can(permissionsFor(null, "CLIENT_EDITOR"), "publish.request"), "editor cannot publish");
assert(can(permissionsFor(null, "CLIENT_ADMIN"), "publish.request"), "client admin can request publish");
assert(!can(permissionsFor(null, "VIEWER"), "edit"), "viewer cannot edit");
assert(can(permissionsFor("SUPER_ADMIN", null), "repo.connect"), "super admin can connect a repository");
assert(!can(permissionsFor("DESIGNER", null), "repo.connect"), "designer cannot connect a repository");

let rejected = false;
try {
  assertAllowedPath("../secrets.env");
} catch {
  rejected = true;
}
assert(rejected, "path traversal is rejected");

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
assert(sniffImage(png) === "png", "png signature is recognized");
assert(sniffImage(Buffer.from("not an image")) === null, "text is not an image");
assert(placementSchema.safeParse({ x: 0.1, y: 0.2, w: 0.3, h: 0.4 }).success, "a placement share is accepted");
assert(!placementSchema.safeParse({ x: 10, y: 40, w: 300, h: 180 }).success, "pixel positions are rejected");
assert(!placementSchema.safeParse({ x: 0.1, y: 0.2, w: 0.3, h: 0.4, width: 400 }).success, "pixel fields are rejected");
assert(COPPER_TEST_IMAGE === "/media/ee77ec25b974e4a0.png", "the leftover test image is identified");
assert(defaultHomeDraft.heroImage.src === "", "a new homepage starts without an image");

const rewritten = rewritePreviewBody('<a href="/about">About</a>', "/preview/web_quantum_age", "text/html", {
  accessToken: "abc.def",
});
assert(rewritten.includes('href="/preview/web_quantum_age/about?t=abc.def"'), "preview links stay inside the editor");
const styled = rewritePreviewBody('<link rel="stylesheet" href="/app.css"><script src="/app.js"></script>', "/preview/web_quantum_age", "text/html");
assert(styled.includes('crossorigin="anonymous"'), "preview styles can load inside the sandbox");
const css = rewritePreviewBody('src:url("../media/font.woff2")', "/preview/web_quantum_age", "text/css", {
  accessToken: "abc.def",
  assetPath: "/preview/web_quantum_age/_next/static/chunks/site.css",
});
assert(
  css.includes('url("/preview/web_quantum_age/site-assets/static/media/font.woff2?t=abc.def")'),
  "preview fonts keep the access token",
);

const dir = await mkdtemp(path.join(tmpdir(), "editor-git-"));
try {
  await exec("git", ["init", "-b", "main"], { cwd: dir });
  await mkdir(path.join(dir, "src/content/pages"), { recursive: true });
  await writeFile(path.join(dir, "src/content/pages/home.json"), '{"tagline":"Original"}\n');
  await exec("git", ["add", "src/content/pages/home.json"], { cwd: dir });
  await exec("git", ["-c", "user.email=test@4eos.test", "-c", "user.name=Test", "commit", "-m", "base"], { cwd: dir });
  const mainBefore = (await exec("git", ["rev-parse", "HEAD"], { cwd: dir })).stdout.trim();
  await writeFile(path.join(dir, "src/content/pages/home.json"), '{"tagline":"Edited"}\n');
  const committed = await commitAllowedChanges({
    cwd: dir,
    branch: "editor/quantum-age/abc123",
    files: ["src/content/pages/home.json"],
    message: "Update approved website content",
  });
  assert(committed.commitSha && committed.commitSha !== mainBefore, "a commit was created");
  const branch = (await exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: dir })).stdout.trim();
  assert(branch === "editor/quantum-age/abc123", "the editing branch is checked out");
  const mainAfter = (await exec("git", ["rev-parse", "main"], { cwd: dir })).stdout.trim();
  assert(mainAfter === mainBefore, "the production branch did not move");
  const body = await readFile(path.join(dir, "src/content/pages/home.json"), "utf8");
  assert(body.includes("Edited"), "the edited heading was saved");

  let opened = false;
  const pull = await openPullRequest(
    {
      async createPullRequest(input) {
        opened = true;
        assert(input.base === "main", "the review targets main");
        assert(input.head === "editor/quantum-age/abc123", "the review comes from the editing branch");
        return { url: "https://github.com/4EOSWeb/quantum-age/pull/1", number: 1 };
      },
    },
    {
      owner: "4EOSWeb",
      repo: "quantum-age",
      title: "Website edits",
      body: "Heading changed",
      head: "editor/quantum-age/abc123",
      base: "main",
    },
  );
  assert(opened && pull.url.endsWith("/pull/1"), "a pull request is opened without merging");
  let refused = false;
  try {
    await openPullRequest(
      { async createPullRequest() { return { url: "", number: 0 }; } },
      { owner: "4EOSWeb", repo: "quantum-age", title: "bad", body: "", head: "main", base: "main" },
    );
  } catch {
    refused = true;
  }
  assert(refused, "a pull request from main is refused");
} finally {
  await rm(dir, { recursive: true, force: true });
}

console.log("slice checks passed");
