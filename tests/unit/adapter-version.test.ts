import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFileSync } from "node:fs";
import sample from "../fixtures/adapters/sample/adapter.ts";
import { parseAdapter } from "../../src/platform/adapter/index.ts";
import { discoverAdapters } from "../../src/platform/discover-adapters.ts";

test("version 1 parses and an unknown version is rejected", async () => {
  const parsed = parseAdapter(sample);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.value.version, 1);
  const unknown = parseAdapter({ version: 99 });
  assert.equal(unknown.ok, false);
  if (!unknown.ok) {
    assert.equal(unknown.error.code, "adapter_invalid");
    assert.equal(unknown.error.path, "version");
  }
  const found = await discoverAdapters(path.join(process.cwd(), "tests/fixtures/adapters"));
  assert.equal(found.ok, true);
  if (found.ok) assert.deepEqual(found.value, ["sample"]);
  const editor = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  assert.equal(editor.includes("parseAdapter"), false);
});
