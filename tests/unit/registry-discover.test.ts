import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sample from "../fixtures/adapters/sample/adapter.ts";
import { parseAdapter } from "../../src/platform/adapter/index.ts";
import { registryFromAdapter } from "../../src/platform/registry/discover.ts";

test("the sample adapter registers sample.text without scanning a site", () => {
  const parsed = parseAdapter(sample);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const registry = registryFromAdapter(parsed.value);
  assert.equal(registry.ok, true);
  if (registry.ok) assert.equal(registry.value.get("sample.text")?.id, "sample.text");
  const source = readFileSync(new URL("../../src/platform/registry/discover.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays"), false);
});
