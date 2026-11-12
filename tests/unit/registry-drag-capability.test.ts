import { test } from "node:test";
import assert from "node:assert/strict";
import { canDrag } from "../../src/platform/registry/capabilities.ts";

test("locked nodes cannot drag and unlocked draggable nodes can", () => {
  const draggable = { capabilities: { draggable: true } };
  assert.equal(canDrag(draggable, { locked: { locked: true } }), false);
  assert.equal(canDrag(draggable, { locked: { locked: false } }), true);
  assert.equal(canDrag({ capabilities: { draggable: false } }, { locked: { locked: false } }), false);
});
