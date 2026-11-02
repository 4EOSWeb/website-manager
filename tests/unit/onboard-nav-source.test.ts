import { test } from "node:test";
import assert from "node:assert/strict";
import { navigationSourceOnboarding } from "../../src/app/sites/new/path-rules.ts";

test("document and adapter are both valid navigation sources", () => {
  assert.deepEqual(navigationSourceOnboarding("document"), { ok: true, onboarding: { navigationSource: "document" } });
  assert.deepEqual(navigationSourceOnboarding("adapter"), { ok: true, onboarding: { navigationSource: "adapter" } });
  const other = navigationSourceOnboarding("header.tsx");
  assert.equal(other.ok, false);
  if (!other.ok) assert.match(other.problem, /document or adapter/);
});
