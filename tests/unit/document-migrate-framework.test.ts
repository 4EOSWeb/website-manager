import { test } from "node:test";
import assert from "node:assert/strict";
import { migrateDocument, migrations } from "../../src/platform/document/migrate.ts";
import { emptyCanvasPage } from "./fixtures/empty-canvas-page.ts";

test("version 1 stays itself and version 3 is refused", () => {
  assert.equal(migrations.every((step) => typeof step.down === "function"), true);
  const migrated = migrateDocument(emptyCanvasPage, 1);
  assert.equal(migrated.ok, true);
  if (migrated.ok) {
    const document = migrated.value as typeof emptyCanvasPage;
    assert.equal(document.pages[0]?.id, emptyCanvasPage.pages[0]?.id);
    assert.equal(document.pages[0]?.root.id, emptyCanvasPage.pages[0]?.root.id);
  }
  const refused = migrateDocument({ version: 3 }, 1);
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.equal(refused.error.code, "migration_failed");
});
