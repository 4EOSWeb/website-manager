import { test } from "node:test";
import assert from "node:assert/strict";
import { dropIsAfter, layerDragAllowed, reorderLayerSiblings, siblingBeforeId } from "../../src/components/editor/layers/reorder-drop.ts";

function fake(matches: string[]) {
  return { closest: (selector: string) => (matches.includes(selector) ? {} : null) };
}

test("a rename field does not start a layer drag", () => {
  assert.equal(layerDragAllowed(fake(["input, textarea, select, [contenteditable='true']", "[data-layer-id]"])), false);
  assert.equal(layerDragAllowed(fake([".ed-icon, [data-layer-toggle]", "[data-layer-id]"])), false);
  assert.equal(layerDragAllowed(fake(["[data-layer-id]"])), true);
  assert.equal(layerDragAllowed(null), false);
});

test("the lower half of a row inserts after that sibling", () => {
  assert.equal(dropIsAfter(20, 0, 20), true);
  assert.equal(dropIsAfter(9, 0, 20), false);
  assert.equal(siblingBeforeId(["eye", "heading", "paragraph"], "heading", "paragraph", true), "");
  assert.equal(siblingBeforeId(["eye", "heading", "paragraph", "copy"], "heading", "paragraph", true), "copy");
  assert.equal(siblingBeforeId(["eye", "heading", "paragraph"], "paragraph", "heading", false), "heading");
  assert.equal(siblingBeforeId(["eye", "heading"], "heading", "heading", true), null);
});

test("a canvas parent reorders children and leaves z alone", () => {
  const document = {
    version: 1,
    pages: [{
      route: "/",
      root: {
        id: "canvas",
        type: "canvas",
        children: [
          { id: "a", type: "button", box: { x: 0.1, y: 0.1, w: 0.2, h: 0.2, z: 3 }, children: [] },
          { id: "b", type: "image", box: { x: 0.2, y: 0.2, w: 0.2, h: 0.2, z: 1 }, children: [] },
          { id: "c", type: "heading", box: { x: 0.3, y: 0.3, w: 0.2, h: 0.2, z: 8 }, children: [] },
        ],
      },
    }],
  };
  const next = reorderLayerSiblings(document, "a", "c", true) as {
    pages: { root: { children: { id: string; box: { z: number } }[] } }[];
  };
  assert.deepEqual(next.pages[0]?.root.children.map((child) => child.id), ["b", "c", "a"]);
  assert.deepEqual(next.pages[0]?.root.children.map((child) => child.box.z), [1, 8, 3]);
  assert.equal(reorderLayerSiblings(document, "a", "b", false), null);
  const split = {
    pages: [{
      root: {
        id: "root",
        children: [
          { id: "left", children: [{ id: "a", box: { z: 2 } }] },
          { id: "right", children: [{ id: "c", box: { z: 9 } }] },
        ],
      },
    }],
  };
  assert.equal(reorderLayerSiblings(split, "a", "c", true), null);
});
