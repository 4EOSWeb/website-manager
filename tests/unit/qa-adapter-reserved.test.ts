import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pageRulesSchema } from "../../src/platform/adapter/page-rules.ts";
import { quantumAgePageRules } from "../../adapters/quantum-age/page-rules.ts";
import { BUILT_IN_ROUTES } from "../../src/lib/content-schema.ts";
import { RESERVED } from "../../src/lib/editor-ops.ts";

test("adapter reserved routes match the editor constants", () => {
  const union = [...new Set([...RESERVED, ...BUILT_IN_ROUTES])].sort();
  assert.equal(pageRulesSchema.safeParse(quantumAgePageRules).success, true);
  assert.deepEqual([...quantumAgePageRules.reservedRoutes].sort(), union);
  assert.equal(quantumAgePageRules.canCreate, true);
  assert.equal(quantumAgePageRules.canDelete, true);
  const ops = readFileSync(new URL("../../src/lib/editor-ops.ts", import.meta.url), "utf8");
  const schema = readFileSync(new URL("../../src/lib/content-schema.ts", import.meta.url), "utf8");
  assert.match(ops, /Removal is step 14\.10 after the editor reads the adapter/);
  assert.match(schema, /Removal is step 14\.10 after the editor reads the adapter/);
  assert.match(ops, /export const RESERVED/);
  assert.match(schema, /export const BUILT_IN_ROUTES/);
});
