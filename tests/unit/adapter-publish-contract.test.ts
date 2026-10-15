import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validatePublication } from "../../src/platform/adapter/publish.ts";

test("disabled publishing can omit files and review mode cannot", () => {
  assert.equal(validatePublication(false, { mode: "disabled", allowlist: [] }).ok, true);
  const empty = validatePublication(true, { mode: "review-branch", allowlist: [] });
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.error.path, "publish.allowlist");
  assert.equal(validatePublication(true, { mode: "review-branch", allowlist: ["src/content/editor/document.json"] }).ok, true);
  const publish = readFileSync(new URL("../../src/lib/publish.ts", import.meta.url), "utf8");
  assert.equal(publish.includes("ADAPTER_FILES"), true);
});
