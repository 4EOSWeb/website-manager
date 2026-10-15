import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { layerKeyAction, type LayerKeyRow } from "../../src/components/editor/layers/keyboard-nav.ts";

const rows: LayerKeyRow[] = [
  { id: "who", parentId: "page", expanded: true },
  { id: "blk_who_h", parentId: "who", expanded: null },
  { id: "blk_who_p", parentId: "who", expanded: null },
  { id: "audience", parentId: "page", expanded: false },
];

test("arrow keys move the active layer and leave a rename field alone", () => {
  assert.deepEqual(layerKeyAction(rows, "blk_who_h", "ArrowDown"), { type: "select", id: "blk_who_p" });
  assert.deepEqual(layerKeyAction(rows, "blk_who_p", "ArrowUp"), { type: "select", id: "blk_who_h" });
  assert.deepEqual(layerKeyAction(rows, "blk_who_p", "ArrowDown"), { type: "select", id: "audience" });
  assert.deepEqual(layerKeyAction(rows, "", "ArrowDown"), { type: "select", id: "who" });
  assert.deepEqual(layerKeyAction(rows, "who", "ArrowUp"), { type: "ignore" });
  assert.deepEqual(layerKeyAction(rows, "audience", "ArrowRight"), { type: "expand", id: "audience" });
  assert.deepEqual(layerKeyAction(rows, "who", "ArrowRight"), { type: "select", id: "blk_who_h" });
  assert.deepEqual(layerKeyAction(rows, "who", "ArrowLeft"), { type: "collapse", id: "who" });
  assert.deepEqual(layerKeyAction(rows, "blk_who_h", "ArrowLeft"), { type: "select", id: "who" });
  assert.deepEqual(layerKeyAction(rows, "blk_who_h", "Enter"), { type: "select", id: "blk_who_h" });
  assert.deepEqual(layerKeyAction(rows, "blk_who_h", "x", true), { type: "ignore" });
  assert.deepEqual(layerKeyAction(rows, "blk_who_h", "ArrowDown", true), { type: "ignore" });
  const keyboard = readFileSync(new URL("../../src/components/editor/layers/keyboard.tsx", import.meta.url), "utf8");
  const panel = readFileSync(new URL("../../src/components/editor/panels.tsx", import.meta.url), "utf8");
  assert.equal(keyboard.includes("window.addEventListener"), false);
  assert.equal(keyboard.includes('closest("input, textarea, [contenteditable=\'true\']")'), true);
  assert.equal(panel.includes('role="tree"'), true);
  assert.equal(panel.includes("useLayerKeyboard"), true);
  assert.equal(panel.includes("tabIndex={0}"), true);
});
