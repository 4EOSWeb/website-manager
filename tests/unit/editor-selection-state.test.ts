import { test } from "node:test";
import assert from "node:assert/strict";
import { clearNodeSelection, nodeIdsFromLegacy, selectNodeId } from "../../src/components/editor/state/selection.ts";

test("selecting a node stores its id", () => {
  assert.deepEqual(selectNodeId("blk_who_h"), { nodeIds: ["blk_who_h"] });
  assert.deepEqual(nodeIdsFromLegacy({ sectionId: "who", itemId: "blk_who_h", itemIds: ["blk_who_h"] }), { nodeIds: ["blk_who_h"] });
  assert.deepEqual(nodeIdsFromLegacy({ sectionId: "hero", itemId: "", itemIds: [] }), { nodeIds: ["hero"] });
});

test("switching pages clears the ids", () => {
  const selected = selectNodeId("blk_who_h");
  assert.deepEqual(selected.nodeIds, ["blk_who_h"]);
  assert.deepEqual(clearNodeSelection(), { nodeIds: [] });
  assert.deepEqual(nodeIdsFromLegacy({ sectionId: "", itemId: "", itemIds: [] }), { nodeIds: [] });
});
