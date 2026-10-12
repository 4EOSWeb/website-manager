import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resizeCorner, resizeFromHandle, resizeHandles } from "../../src/platform/canvas/resize.ts";

const image = { capabilities: { resizable: true } };
const logo = { capabilities: { resizable: false } };
const unlocked = { locked: { locked: false } };
const locked = { locked: { locked: true } };
const canvas = { mode: "canvas" };
const flow = { mode: "flow" };
const box = { x: 10, y: 20, w: 36, h: 28 };

test("a resizable image on a canvas shows four corner handles", () => {
  assert.deepEqual(resizeHandles(image, unlocked, canvas), ["nw", "ne", "sw", "se"]);
  const next = resizeFromHandle({
    definition: image,
    node: unlocked,
    parent: canvas,
    box,
    corner: "se",
    delta: { x: 8, y: 6 },
    selectionCollapsed: true,
    selectionInsideNode: false,
  });
  assert.deepEqual(next, { x: 10, y: 20, w: 44, h: 34 });
});

test("a non-resizable locked logo shows no handles and does not resize", () => {
  assert.deepEqual(resizeHandles(logo, locked, canvas), []);
  assert.deepEqual(resizeHandles(image, locked, canvas), []);
  assert.deepEqual(resizeHandles(logo, unlocked, canvas), []);
  assert.deepEqual(resizeHandles(image, unlocked, flow), []);
  const next = resizeFromHandle({
    definition: logo,
    node: locked,
    parent: canvas,
    box,
    corner: "se",
    delta: { x: 8, y: 6 },
    selectionCollapsed: true,
    selectionInsideNode: false,
  });
  assert.equal(next, null);
});

test("dragging a corner changes width and height", () => {
  const grown = resizeCorner(box, "se", { x: 8, y: 6 });
  assert.equal(grown.w, 44);
  assert.equal(grown.h, 34);
  assert.equal(grown.x, 10);
  assert.equal(grown.y, 20);
  const shrunk = resizeCorner(box, "nw", { x: 4, y: 5 });
  assert.equal(shrunk.w, 32);
  assert.equal(shrunk.h, 23);
  assert.equal(shrunk.x, 14);
  assert.equal(shrunk.y, 25);
});

test("selecting text does not resize", () => {
  const next = resizeFromHandle({
    definition: image,
    node: unlocked,
    parent: canvas,
    box,
    corner: "se",
    delta: { x: 8, y: 6 },
    selectionCollapsed: false,
    selectionInsideNode: true,
  });
  assert.equal(next, null);
  const source = readFileSync(new URL("../../src/platform/canvas/resize.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const script = readFileSync(new URL("../../overlays/quantum-age/src/components/site/canvas-script.ts", import.meta.url), "utf8");
  assert.equal(script.includes("function canvasHandlesFor"), true);
  assert.equal(script.includes('node.getAttribute("data-kind") === "image"'), true);
  assert.equal(script.includes('element.closest(".eos-handle")'), true);
});
