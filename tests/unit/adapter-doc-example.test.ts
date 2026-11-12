import assert from "node:assert/strict";
import test from "node:test";
import sample from "../fixtures/adapters/sample/adapter.ts";
import { parseAdapter } from "../../src/platform/adapter/index.ts";

test("the documented sample adapter parses and is not Quantum Age", () => {
  const parsed = parseAdapter(sample);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.site.id, "sample");
  assert.equal(JSON.stringify(sample).toLowerCase().includes("quantum"), false);
});
