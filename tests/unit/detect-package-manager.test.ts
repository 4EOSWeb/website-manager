import { test } from "node:test";
import assert from "node:assert/strict";
import { detectPackageManager } from "../../src/platform/onboarding/detect-package-manager.ts";

test("each lockfile maps to its package manager", () => {
  assert.deepEqual(detectPackageManager(["package.json", "package-lock.json"]), { ok: true, packageManager: "npm" });
  assert.deepEqual(detectPackageManager(["pnpm-lock.yaml"]), { ok: true, packageManager: "pnpm" });
  assert.deepEqual(detectPackageManager(["yarn.lock"]), { ok: true, packageManager: "yarn" });
});

test("multiple lockfiles fail", () => {
  const detected = detectPackageManager(["package-lock.json", "pnpm-lock.yaml"]);
  assert.equal(detected.ok, false);
  if (!detected.ok) assert.match(detected.problem, /more than one/i);
});

test("no lockfile fails", () => {
  const detected = detectPackageManager(["package.json"]);
  assert.equal(detected.ok, false);
  if (!detected.ok) assert.match(detected.problem, /no package manager/i);
});
