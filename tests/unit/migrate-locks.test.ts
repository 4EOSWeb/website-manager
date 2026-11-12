import assert from "node:assert/strict";
import { test } from "node:test";
import { assertLocksPreserved } from "../../src/platform/migrate/locks.ts";

test("a locked block stays locked and an unlocked paragraph stays unlocked", () => {
  const kept = assertLocksPreserved(
    [
      { id: "mark", locked: true },
      { id: "paragraph", locked: false },
    ],
    [
      { id: "mark", locked: { locked: true } },
      { id: "paragraph", locked: { locked: false } },
    ],
  );
  assert.equal(kept.ok, true);

  const managed = assertLocksPreserved(
    [{ id: "preset", providerLocked: true }],
    [{ id: "preset", source: { providerManaged: true } }],
  );
  assert.equal(managed.ok, true);

  const lost = assertLocksPreserved([{ id: "mark", locked: true }], [{ id: "mark", locked: { locked: false } }]);
  assert.equal(lost.ok, false);
  if (!lost.ok) assert.equal(lost.error.code, "migration_failed");

  const invented = assertLocksPreserved([{ id: "paragraph", locked: false }], [{ id: "paragraph", locked: { locked: true } }]);
  assert.equal(invented.ok, false);
});
