import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pageRulesSchema } from "../../src/platform/adapter/page-rules.ts";
import { quantumAgePageRules } from "../../adapters/quantum-age/page-rules.ts";

test("adapter reserved routes stay on the adapter", () => {
  assert.equal(pageRulesSchema.safeParse(quantumAgePageRules).success, true);
  assert.deepEqual([...quantumAgePageRules.reservedRoutes].sort(), [
    "/",
    "/about",
    "/approach",
    "/contact",
    "/insights",
    "/privacy",
    "/prototype-notes",
    "/references",
    "/solutions",
    "/team",
    "/terms",
  ]);
  assert.equal(quantumAgePageRules.canCreate, true);
  assert.equal(quantumAgePageRules.canDelete, true);
  const ops = readFileSync(new URL("../../src/lib/editor-ops.ts", import.meta.url), "utf8");
  const schema = readFileSync(new URL("../../src/lib/content-schema.ts", import.meta.url), "utf8");
  assert.equal(ops.includes("export const RESERVED"), false);
  assert.equal(schema.includes("export const BUILT_IN_ROUTES"), false);
});
