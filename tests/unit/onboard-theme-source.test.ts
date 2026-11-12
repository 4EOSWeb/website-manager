import { test } from "node:test";
import assert from "node:assert/strict";
import { themeSourceOnboarding } from "../../src/app/sites/new/path-rules.ts";

test("adapter is a theme source and an http URL is rejected", () => {
  assert.deepEqual(themeSourceOnboarding("adapter"), { ok: true, onboarding: { themeSource: "adapter" } });
  assert.deepEqual(themeSourceOnboarding("src/app/globals.css"), { ok: true, onboarding: { themeSource: "src/app/globals.css" } });
  const remote = themeSourceOnboarding("http://example.com/theme.css");
  assert.equal(remote.ok, false);
  if (!remote.ok) assert.match(remote.problem, /repository|adapter/i);
  const secure = themeSourceOnboarding("https://cdn.example/tokens.css");
  assert.equal(secure.ok, false);
});
