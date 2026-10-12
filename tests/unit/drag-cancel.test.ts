import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cancelDrag, releaseAfterCancel } from "../../src/platform/drag/cancel.ts";

const order = ["node_a10000000001", "node_a10000000002", "node_a10000000003"];

test("escape during a drag clears the gesture and leaves the order", () => {
  const decision = cancelDrag({ dragging: true, dialogOpen: false, key: "Escape" });
  assert.deepEqual(decision, { cancel: true, clearStatus: true });
  assert.deepEqual(releaseAfterCancel(decision.cancel), { applyDrop: false });
  assert.deepEqual(order.slice(), order);
});

test("escape outside a drag, or while a dialog is open, does not cancel", () => {
  assert.deepEqual(cancelDrag({ dragging: false, dialogOpen: false, key: "Escape" }), { cancel: false, clearStatus: false });
  assert.deepEqual(cancelDrag({ dragging: true, dialogOpen: true, key: "Escape" }), { cancel: false, clearStatus: false });
  assert.deepEqual(cancelDrag({ dragging: true, dialogOpen: false, key: "Enter" }), { cancel: false, clearStatus: false });
  assert.deepEqual(releaseAfterCancel(false), { applyDrop: true });
  const source = readFileSync(new URL("../../src/platform/drag/cancel.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
