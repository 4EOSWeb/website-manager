import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { componentDefinitionSchema } from "../../src/platform/adapter/components.ts";
import { lockingSchema } from "../../src/platform/document/locking.ts";
import { nodeTypes } from "../../src/platform/document/node-type.ts";
import { canUnlock } from "../../src/platform/registry/locking.ts";
import { quantumAgeLogo, quantumAgeLogoLock } from "../../adapters/quantum-age/components/logo.ts";

test("the quantum age logo lock stays on the adapter", () => {
  assert.equal(componentDefinitionSchema.safeParse(quantumAgeLogo).success, true);
  assert.equal(quantumAgeLogo.locking.locked, true);
  assert.equal(quantumAgeLogoLock.defaultLocked, true);
  assert.equal(canUnlock(quantumAgeLogoLock, "administrator"), true);
  assert.equal(canUnlock(quantumAgeLogoLock, "editor"), false);
  assert.deepEqual(Object.keys(quantumAgeLogo.defaultProps), ["src", "alt"]);
  assert.equal(nodeTypes.includes("image"), true);
  assert.equal(lockingSchema.safeParse({ locked: false }).success, true);
  const platform = readFileSync(new URL("../../src/platform/document/locking.ts", import.meta.url), "utf8");
  assert.equal(platform.includes("logo"), false);
  const scan = spawnSync("rg", ["brand-mark", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
