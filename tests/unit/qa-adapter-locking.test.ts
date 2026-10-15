import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { canUnlock } from "../../src/platform/registry/locking.ts";
import { externalLockedFiles, quantumAgeFooterLock, quantumAgeHeaderLock, quantumAgeLogoLock } from "../../adapters/quantum-age/locking.ts";

test("quantum age lock names stay in the adapter and the editor config", () => {
  const config = JSON.parse(readFileSync(new URL("../../overlays/quantum-age/4eos.editor.config.json", import.meta.url), "utf8")) as {
    lockedComponents: string[];
  };
  assert.deepEqual([...externalLockedFiles], config.lockedComponents);
  for (const policy of [quantumAgeHeaderLock, quantumAgeFooterLock, quantumAgeLogoLock]) {
    assert.equal(policy.defaultLocked, true);
    assert.equal(canUnlock(policy, "editor"), false);
  }
  const scan = spawnSync("rg", ["Rings|FormulaStory|start-site", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
