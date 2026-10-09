import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { pageRulesSchema } from "../../src/platform/adapter/page-rules.ts";

test("reserved routes are adapter data, including an empty list", () => {
  assert.equal(pageRulesSchema.safeParse({
    canCreate: true,
    canDelete: false,
    reservedRoutes: ["/"],
    slugPattern: "^[a-z0-9-]+$",
  }).success, true);
  assert.equal(pageRulesSchema.safeParse({
    canCreate: false,
    canDelete: false,
    reservedRoutes: [],
    slugPattern: "^[a-z0-9-]+$",
  }).success, true);
  const scan = spawnSync("rg", ["-n", "/insights", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
