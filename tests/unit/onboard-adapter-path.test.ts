import { test } from "node:test";
import assert from "node:assert/strict";
import { adapterPathOnboarding, contentPathOnboarding, mediaPathOnboarding } from "../../src/app/sites/new/path-rules.ts";

test("a relative adapter path passes and a parent path fails", () => {
  assert.deepEqual(adapterPathOnboarding("adapter.ts"), { ok: true, onboarding: { adapterPath: "adapter.ts" } });
  const parent = adapterPathOnboarding("../secret");
  assert.equal(parent.ok, false);
  if (!parent.ok) assert.match(parent.problem, /repository/);
  const absolute = adapterPathOnboarding("/etc/adapter.ts");
  assert.equal(absolute.ok, false);
});

test("a relative content path passes and a parent path fails", () => {
  assert.deepEqual(contentPathOnboarding("src/content"), { ok: true, onboarding: { contentPath: "src/content" } });
  const parent = contentPathOnboarding("..");
  assert.equal(parent.ok, false);
  if (!parent.ok) assert.match(parent.problem, /repository/);
});

test("a relative media path passes and an absolute path fails", () => {
  assert.deepEqual(mediaPathOnboarding("public/media"), { ok: true, onboarding: { mediaPath: "public/media" } });
  const absolute = mediaPathOnboarding("/var/media");
  assert.equal(absolute.ok, false);
  if (!absolute.ok) assert.match(absolute.problem, /repository/);
});
