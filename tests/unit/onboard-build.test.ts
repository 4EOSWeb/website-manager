import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { storedBuildLog, validateOnboardingBuild } from "../../src/platform/onboarding/validate-build.ts";

test("a failing command fails and logs are redacted", async () => {
  const cwd = path.join(process.cwd(), "fixtures", "onboarding-build-fake");
  const lines = Array.from({ length: 60 }, (_, index) => `line ${index}`);
  lines[59] = "token ghp_shouldnotappear";
  const failed = await validateOnboardingBuild({
    command: "npm run build",
    cwd,
    run: async (input) => {
      assert.equal("EDITOR_PREVIEW" in input.env, false);
      assert.equal("GITHUB_APP_PRIVATE_KEY" in input.env, false);
      return { code: 1, log: lines.join("\n") };
    },
  });
  assert.equal(failed.ok, false);
  if (!failed.ok) {
    assert.equal(failed.problem, "The production build failed.");
    assert.equal(failed.log.includes("line 0"), false);
    assert.equal(failed.log.includes("ghp_shouldnotappear"), false);
    assert.match(failed.log, /\[redacted\]/);
  }
  assert.equal(storedBuildLog(cwd).includes("ghp_shouldnotappear"), false);
});

test("the harbor production build passes", async () => {
  const cwd = path.join(process.cwd(), "fixtures", "harbor");
  const result = await validateOnboardingBuild({ command: "npm run build", cwd, timeoutMs: 180_000 });
  assert.equal(result.ok, true, result.ok ? "" : result.log);
  assert.equal(storedBuildLog(cwd).includes("EDITOR_PREVIEW"), false);
});
