import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canvasPoint, placeOnCanvas } from "../../src/platform/drag/canvas-place.ts";
import { flowReorder } from "../../src/platform/drag/flow-insert.ts";

const parent = "node_a10000000001";
const button = "node_a10000000002";

function document() {
  return {
    version: 1,
    pages: [
      {
        id: "page_aaaaaaaaaaaa",
        route: "/",
        root: {
          id: parent,
          type: "section",
          layout: { mode: "canvas", snap: 4, showGrid: false },
          children: [
            { id: button, type: "button", children: [] },
            { id: "node_a10000000003", type: "text", children: [] },
          ],
        },
      },
    ],
  };
}

test("a canvas point stays parent-relative when the hub panel moves", () => {
  const narrow = { x: 40, y: 80, width: 400, height: 200 };
  const wide = { x: 280, y: 80, width: 400, height: 200 };
  const onNarrow = canvasPoint({ x: 140, y: 130 }, narrow);
  const onWide = canvasPoint({ x: 380, y: 130 }, wide);
  assert.deepEqual(onNarrow, { x: 25, y: 25 });
  assert.deepEqual(onWide, onNarrow);
  assert.deepEqual(canvasPoint({ x: 0, y: 0 }, narrow), { x: 0, y: 0 });
  assert.deepEqual(canvasPoint({ x: 900, y: 900 }, narrow), { x: 100, y: 100 });
});

test("the active breakpoint stores a box from 0 to 100", () => {
  const source = document();
  const desktop = placeOnCanvas(source, { nodeId: button, breakpoint: "desktop", x: 25, y: 40, w: 30, h: 12 });
  assert.ok(desktop);
  const node = (desktop as { pages: { root: { children: { box?: { x: number; y: number }; layout?: unknown }[] } }[] }).pages[0].root.children[0];
  assert.deepEqual(node.box, { x: 25, y: 40, w: 30, h: 12 });
  assert.deepEqual(source.pages[0].root.layout, { mode: "canvas", snap: 4, showGrid: false });
  const tablet = placeOnCanvas(desktop, { nodeId: button, breakpoint: "tablet", x: 10, y: 12, w: 20, h: 8 });
  assert.ok(tablet);
  const stored = (tablet as { pages: { root: { children: { box: { x: number }; responsive: { tablet: { box: { x: number; y: number } } } }[] } }[] }).pages[0].root.children[0];
  assert.equal(stored.box.x, 25);
  assert.deepEqual(stored.responsive.tablet.box, { x: 10, y: 12, w: 20, h: 8 });
  const flowed = flowReorder(source, button, "node_a10000000003", true);
  assert.ok(flowed);
  const ids = (flowed as { pages: { root: { children: { id: string }[] } }[] }).pages[0].root.children.map((child) => child.id);
  assert.deepEqual(ids, ["node_a10000000003", button]);
  const sourceText = readFileSync(new URL("../../src/platform/drag/canvas-place.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(sourceText.includes(word), false, word);
  }
});
