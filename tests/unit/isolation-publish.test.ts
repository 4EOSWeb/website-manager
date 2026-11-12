import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/website_manager";

function gitStatus(cwd: string) {
  if (!fs.existsSync(path.join(cwd, ".git"))) return "";
  return execFileSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" });
}

test("a Harbor publish list cannot include Quantum Age files", async () => {
  const { resolvePublishAllowlist, reviewFilesForSite } = await import("../../src/lib/publish.ts");
  const harborDir = path.resolve("fixtures/harbor");
  const quantumDir = path.resolve(".workspaces/web_quantum_age");
  const before = gitStatus(quantumDir);
  const harbor = await resolvePublishAllowlist("web_harbor");
  const quantum = await resolvePublishAllowlist("web_quantum_age");
  assert.equal(harbor.allowlist.includes("src/app/insights/page.tsx"), false);
  assert.equal(quantum.allowlist.includes("src/app/insights/page.tsx"), true);

  const cross = reviewFilesForSite(harborDir, harbor.allowlist, [
    "src/app/insights/page.tsx",
    path.join(quantumDir, "src/app/insights/page.tsx"),
  ]);
  assert.equal(cross.ok, false);

  const harborCommit = reviewFilesForSite(harborDir, harbor.allowlist, []);
  assert.equal(harborCommit.ok, true);
  if (harborCommit.ok) assert.equal(harborCommit.value.includes("src/app/insights/page.tsx"), false);

  const same = reviewFilesForSite(quantumDir, quantum.allowlist, ["src/app/insights/page.tsx"]);
  assert.equal(same.ok, true);
  if (same.ok) assert.deepEqual(same.value, ["src/app/insights/page.tsx"]);
  assert.equal(gitStatus(quantumDir), before);
});
