import { test } from "node:test";
import assert from "node:assert/strict";
import { detectRouter } from "../../src/platform/onboarding/detect-router.ts";

test("an src/app file list is the app router", () => {
  const detected = detectRouter(["package.json", "src/app/page.tsx", "src/app/layout.tsx"]);
  assert.deepEqual(detected, { ok: true, kind: "app" });
});

test("an src/pages file list is the pages router", () => {
  const detected = detectRouter(["src/pages/index.tsx"]);
  assert.deepEqual(detected, { ok: true, kind: "pages" });
});

test("both router directories ask the administrator to choose", () => {
  const detected = detectRouter(["src/app/page.tsx", "src/pages/index.tsx"]);
  assert.equal(detected.ok, false);
  if (!detected.ok) {
    assert.match(detected.problem, /choose/i);
    assert.match(detected.problem, /src\/app/);
    assert.match(detected.problem, /src\/pages/);
  }
});
