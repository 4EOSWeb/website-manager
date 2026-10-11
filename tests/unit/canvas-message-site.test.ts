import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { messageForSite, nodeIdFromCanvasMessage, selectionTargetForNode } from "../../src/components/editor/use-canvas-messages.ts";

const sections = [{ id: "who", blocks: [{ id: "blk_who_h" }], items: [] }];

test("a message for another website id is ignored", () => {
  assert.equal(messageForSite({ websiteId: "web_other" }, "web_quantum_age"), false);
  assert.equal(messageForSite({ websiteId: "web_quantum_age" }, "web_quantum_age"), true);
  assert.equal(messageForSite({}, "web_quantum_age"), true);
  assert.equal(messageForSite({ websiteId: "" }, "web_quantum_age"), true);
  const source = readFileSync(new URL("../../src/components/editor/use-canvas-messages.ts", import.meta.url), "utf8");
  assert.equal(source.includes("messageForSite"), true);
  assert.equal(source.includes("step 11.31"), true);
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  assert.equal(shell.includes('case "4eos-select"'), true);
  assert.equal(shell.includes('case "4eos-reorder-block"'), true);
});

test("a node message selects that node", () => {
  assert.equal(nodeIdFromCanvasMessage({ type: "4eos-select-node", nodeId: "blk_who_h" }), "blk_who_h");
  assert.deepEqual(selectionTargetForNode(sections, { type: "4eos-select-node", nodeId: "blk_who_h" }), { sectionId: "who", itemId: "blk_who_h" });
  assert.equal(nodeIdFromCanvasMessage({ type: "4eos-select", sectionId: "who", itemId: "blk_who_h" }), "blk_who_h");
  assert.equal(nodeIdFromCanvasMessage({ type: "4eos-scroll" }), null);
});
