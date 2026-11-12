import { test } from "node:test";
import assert from "node:assert/strict";
import { validateNavigation } from "../../src/platform/adapter/navigation.ts";

test("document navigation can omit items, and a closed capability cannot be editable", () => {
  const open = validateNavigation(false, { source: "document", editable: false });
  assert.equal(open.ok, true);
  const blocked = validateNavigation(false, { source: "document", editable: true });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.error.path, "navigation.editable");
});
