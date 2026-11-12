import { test } from "node:test";
import assert from "node:assert/strict";
import { branchOnboarding } from "../../src/app/sites/new/repository-rules.ts";

test("the default branch allows main and develop and rejects a space", () => {
  assert.deepEqual(branchOnboarding(""), { ok: true, onboarding: { defaultBranch: "main" } });
  assert.deepEqual(branchOnboarding("main"), { ok: true, onboarding: { defaultBranch: "main" } });
  assert.deepEqual(branchOnboarding("develop"), { ok: true, onboarding: { defaultBranch: "develop" } });
  const spaced = branchOnboarding("feature branch");
  assert.equal(spaced.ok, false);
  if (!spaced.ok) assert.equal(spaced.problem.includes("space"), true);
});
