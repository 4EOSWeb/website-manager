import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { test } from "node:test";
import assert from "node:assert/strict";
import { commitAllowedChanges, editorBranchName } from "../../src/lib/publish-git.ts";

const exec = promisify(execFile);

async function repo(prefix: string) {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  await exec("git", ["init", "-b", "main"], { cwd: dir });
  await writeFile(path.join(dir, "README.md"), `${prefix}\n`);
  await exec("git", ["add", "README.md"], { cwd: dir });
  await exec("git", ["-c", "user.email=editor@4eos.test", "-c", "user.name=4EOS Website Editor", "commit", "-m", "base"], { cwd: dir });
  return dir;
}

test("a commit refuses a workspace that belongs to the other site", async () => {
  const harbor = await repo("harbor-site-");
  const quantum = await repo("quantum-age-");
  const harborBranch = editorBranchName("harbor-site", "abcd1234");
  const quantumBranch = editorBranchName("quantum-age", "abcd1234");
  assert.notEqual(harborBranch, quantumBranch);
  assert.equal(harborBranch, "editor/harbor-site/abcd1234");
  assert.equal(quantumBranch, "editor/quantum-age/abcd1234");
  const quantumHead = (await exec("git", ["rev-parse", "HEAD"], { cwd: quantum })).stdout.trim();
  try {
    await assert.rejects(
      commitAllowedChanges({
        cwd: quantum,
        workspace: harbor,
        branch: harborBranch,
        files: ["README.md"],
        message: "Update approved website content",
      }),
      /not this site/,
    );
    const after = (await exec("git", ["rev-parse", "HEAD"], { cwd: quantum })).stdout.trim();
    const branch = (await exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: quantum })).stdout.trim();
    assert.equal(after, quantumHead);
    assert.equal(branch, "main");
  } finally {
    await rm(harbor, { recursive: true, force: true });
    await rm(quantum, { recursive: true, force: true });
  }
});
