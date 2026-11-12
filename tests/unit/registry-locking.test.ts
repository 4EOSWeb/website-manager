import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canUnlock, lockForNewInstance, preserveExistingDocument } from "../../src/platform/registry/locking.ts";

test("editors cannot unlock an administrator-only component", () => {
  const policy = { defaultLocked: true, unlockRoles: ["administrator"] as const };
  assert.equal(canUnlock(policy, "editor"), false);
  assert.equal(canUnlock(policy, "administrator"), true);
  const existing = { version: 3, pages: [{ id: "page_0123456789ab", locked: { locked: false } }] };
  const before = structuredClone(existing);
  assert.deepEqual(preserveExistingDocument(existing), before);
  assert.deepEqual(existing, before);
  assert.deepEqual(lockForNewInstance(policy), { locked: true });
  const source = readFileSync(new URL("../../src/platform/registry/locking.ts", import.meta.url), "utf8");
  assert.equal(/quantum|insights|logo|formula/i.test(source), false);
});
