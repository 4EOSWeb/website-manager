import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dragBlocked } from "../../src/platform/drag/guard.ts";

const clear = { selectionCollapsed: true, selectionInsideNode: false, targetTag: "p", contentEditable: false, onGrip: false };

test("a text selection or a control does not drag", () => {
  assert.equal(dragBlocked(clear), false);
  assert.equal(dragBlocked({ ...clear, selectionCollapsed: false, selectionInsideNode: true }), true);
  assert.equal(dragBlocked({ ...clear, selectionCollapsed: false, selectionInsideNode: false }), false);
  for (const targetTag of ["input", "textarea", "button", "a"]) {
    assert.equal(dragBlocked({ ...clear, targetTag }), true, targetTag);
  }
  assert.equal(dragBlocked({ ...clear, contentEditable: true }), true);
  assert.equal(dragBlocked({ ...clear, onGrip: true, targetTag: "button" }), false);
  assert.equal(dragBlocked({ ...clear, onGrip: true, selectionCollapsed: false, selectionInsideNode: true }), true);
  const source = readFileSync(new URL("../../src/platform/drag/guard.ts", import.meta.url), "utf8").toLowerCase();
  const overlay = readFileSync(new URL("../../overlays/quantum-age/src/components/site/canvas-script.ts", import.meta.url), "utf8");
  assert.equal(overlay.includes("function selectionBlocksDrag"), true);
  assert.equal(overlay.includes('closest(".eos-bar")'), true);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
