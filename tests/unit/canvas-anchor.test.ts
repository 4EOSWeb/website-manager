import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { anchorPoint, applyAnchor } from "../../src/platform/canvas/anchor.ts";
import { placeOnCanvas } from "../../src/platform/drag/canvas-place.ts";

const grown = { width: 800, height: 400 };
const start = { width: 400, height: 200 };

test("top-left keeps x and y when the parent grows", () => {
  const box = { x: 10, y: 20, w: 40, h: 30, anchor: "top-left" as const };
  const next = applyAnchor(box, start, grown);
  assert.equal(next.x, 10);
  assert.equal(next.y, 20);
  const plain = applyAnchor({ x: 10, y: 20, w: 40, h: 30 }, start, grown);
  assert.equal(plain.x, next.x);
  assert.equal(plain.y, next.y);
});

test("center anchor keeps the center", () => {
  const box = { x: 10, y: 20, w: 40, h: 30, anchor: "center" as const };
  const before = anchorPoint(box);
  const next = applyAnchor(box, start, grown);
  assert.deepEqual(anchorPoint(next), before);
  assert.equal(before.x, 30);
  assert.equal(before.y, 35);
  const stored = placeOnCanvas({
    version: 1,
    pages: [{
      id: "page_aaaaaaaaaaaa",
      route: "/",
      root: {
        id: "node_a10000000001",
        type: "section",
        children: [{ id: "node_a10000000002", type: "image", box: { x: 10, y: 20, w: 40, h: 30, anchor: "center" }, children: [] }],
      },
    }],
  }, { nodeId: "node_a10000000002", breakpoint: "desktop", x: 10, y: 20, w: 40, h: 30 });
  const saved = (stored as { pages: { root: { children: { box: { anchor?: string; x: number; w: number } }[] } }[] }).pages[0].root.children[0].box;
  assert.equal(saved.anchor, "center");
  assert.equal(saved.x + saved.w / 2, 30);
  const source = readFileSync(new URL("../../src/platform/canvas/anchor.ts", import.meta.url), "utf8");
  assert.equal(source.includes("innerWidth"), false);
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
