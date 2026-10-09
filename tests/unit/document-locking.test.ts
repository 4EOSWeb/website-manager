import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lockingSchema } from "../../src/platform/document/locking.ts";

test("a lock without a reason id is valid", () => {
  assert.equal(lockingSchema.safeParse({ locked: true }).success, true);
  assert.equal(lockingSchema.safeParse({ locked: true, lockId: "region.frame" }).success, true);
  const source = readFileSync(new URL("../../src/platform/document/locking.ts", import.meta.url), "utf8");
  assert.equal(source.includes("brand"), false);
});
