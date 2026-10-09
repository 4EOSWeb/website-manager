import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFileSync } from "node:fs";
import { discoverAdapters } from "../../src/platform/discover-adapters.ts";

test("discovery finds the sample adapter and ignores a directory without one", async () => {
  const result = await discoverAdapters(path.join(process.cwd(), "tests/fixtures/adapters"));
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, ["sample"]);
  const source = readFileSync(new URL("../../src/platform/discover-adapters.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
});
