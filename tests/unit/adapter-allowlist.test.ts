import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assertAllowed } from "../../src/platform/adapter/allowlist.ts";

test("allowlist prefixes stay on a directory boundary", () => {
  const allowed = assertAllowed("src/content/editor/document.json", ["src/content/"]);
  assert.equal(allowed.ok, true);
  const parent = assertAllowed("../secrets", ["src/content/"]);
  assert.equal(parent.ok, false);
  const outside = assertAllowed("src/app/insights/page.tsx", ["src/content/"]);
  assert.equal(outside.ok, false);
  const source = readFileSync(new URL("../../src/platform/adapter/allowlist.ts", import.meta.url), "utf8");
  assert.equal(source.includes("insights"), false);
  const publish = readFileSync(new URL("../../src/lib/publish.ts", import.meta.url), "utf8");
  assert.equal(publish.includes("export const ADAPTER_FILES") || publish.includes("ADAPTER_FILES"), true);
  assert.equal(publish.includes("assertAllowed"), false);
});
