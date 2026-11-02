import { test } from "node:test";
import assert from "node:assert/strict";
import { adapterPathOnboarding } from "../../src/app/sites/new/path-rules.ts";

test("a relative adapter path passes and a parent path fails", () => {
  assert.deepEqual(adapterPathOnboarding("adapter.ts"), { ok: true, onboarding: { adapterPath: "adapter.ts" } });
  const parent = adapterPathOnboarding("../secret");
  assert.equal(parent.ok, false);
  if (!parent.ok) assert.match(parent.problem, /repository/);
  const absolute = adapterPathOnboarding("/etc/adapter.ts");
  assert.equal(absolute.ok, false);
});
