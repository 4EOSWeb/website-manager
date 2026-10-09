import { test } from "node:test";
import assert from "node:assert/strict";
import { autoScrollStep, passedThreshold, pressIntent } from "../../overlays/quantum-age/src/components/site/canvas/gesture.ts";
import { insertionIndex, nudgeBox, sectionDropIndex, snapBox } from "../../overlays/quantum-age/src/components/site/canvas/targets.ts";
import { placeToolbar } from "../../overlays/quantum-age/src/components/site/canvas/toolbar-position.ts";

const press = { editing: false, insideEditingField: false, onControl: false, onGrip: false, onResizeHandle: false, onFreeformItem: false, locked: false };

test("a press on ordinary content never starts a drag", () => {
  assert.equal(pressIntent(press), "text");
});

test("only the grip moves structured content", () => {
  assert.equal(pressIntent({ ...press, onGrip: true }), "grip");
  assert.equal(pressIntent({ ...press, onGrip: true, locked: true }), "none");
});

test("text being edited always wins over moving", () => {
  assert.equal(pressIntent({ ...press, editing: true, insideEditingField: true, onFreeformItem: true }), "text");
  assert.equal(pressIntent({ ...press, editing: true, onFreeformItem: true }), "text");
});

test("freeform items move directly unless locked", () => {
  assert.equal(pressIntent({ ...press, onFreeformItem: true }), "freeform");
  assert.equal(pressIntent({ ...press, onFreeformItem: true, locked: true }), "text");
  assert.equal(pressIntent({ ...press, onResizeHandle: true, onFreeformItem: true }), "resize");
});

test("toolbar buttons are not drag sources", () => {
  assert.equal(pressIntent({ ...press, onControl: true, onFreeformItem: true }), "none");
});

test("movement must pass the threshold", () => {
  assert.equal(passedThreshold(10, 10, 13, 14, 6), false);
  assert.equal(passedThreshold(10, 10, 17, 10, 6), true);
});

test("auto-scroll speeds up near the edges and stops in the middle", () => {
  assert.equal(autoScrollStep(400, 800, 48, 20), 0);
  assert.ok(autoScrollStep(4, 800, 48, 20) < 0);
  assert.ok(autoScrollStep(796, 800, 48, 20) > 0);
  assert.ok(Math.abs(autoScrollStep(0, 800, 48, 20)) >= Math.abs(autoScrollStep(40, 800, 48, 20)));
});

test("section drops ignore gaps that would not move anything", () => {
  const gaps = [0, 1, 2, 3].map((index) => ({ index, center: index * 100 }));
  assert.equal(sectionDropIndex(105, gaps, 1), null);
  assert.equal(sectionDropIndex(195, gaps, 1), null);
  assert.equal(sectionDropIndex(290, gaps, 1), 3);
  assert.equal(sectionDropIndex(-20, gaps, 1), 0);
});

test("insertion index works for stacked and side-by-side blocks", () => {
  const stacked = [0, 1, 2].map((index) => ({ top: index * 50, left: 0, width: 300, height: 40 }));
  assert.deepEqual(insertionIndex(10, 5, stacked), { index: 0, horizontal: false });
  assert.deepEqual(insertionIndex(10, 70, stacked), { index: 2, horizontal: false });
  const row = [0, 1, 2].map((index) => ({ top: 0, left: index * 200, width: 180, height: 120 }));
  assert.deepEqual(insertionIndex(250, 60, row), { index: 1, horizontal: true });
  assert.deepEqual(insertionIndex(330, 60, row), { index: 2, horizontal: true });
});

test("boxes snap to the zone centre and report the guide", () => {
  const result = snapBox({ x: 0.255, y: 0.1, w: 0.5, h: 0.2 }, [], 1000, 500, 8);
  assert.equal(result.box.x, 0.25);
  assert.deepEqual(result.guidesX, [0.5]);
});

test("boxes snap to other items and stay inside the zone", () => {
  const result = snapBox({ x: 0.403, y: 0.95, w: 0.2, h: 0.2 }, [{ x: 0.4, y: 0, w: 0.1, h: 0.1 }], 1000, 500, 8);
  assert.equal(result.box.x, 0.4);
  assert.ok(result.box.y + result.box.h <= 1);
});

test("nudging clamps to the zone", () => {
  assert.deepEqual(nudgeBox({ x: 0.98, y: 0, w: 0.1, h: 0.1 }, 0.05, -0.05), { x: 0.9, y: 0, w: 0.1, h: 0.1 });
});

test("the toolbar sits above, flips below, and stays on screen", () => {
  const viewport = { width: 1000, height: 800 };
  const bar = { width: 200, height: 36 };
  assert.equal(placeToolbar({ top: 300, left: 100, width: 400, height: 100 }, bar, viewport, 0, 8).side, "above");
  const flipped = placeToolbar({ top: 20, left: 100, width: 400, height: 100 }, bar, viewport, 0, 8);
  assert.equal(flipped.side, "below");
  assert.equal(flipped.top, 128);
  assert.equal(placeToolbar({ top: 300, left: 950, width: 40, height: 40 }, bar, viewport, 0, 8).left, 792);
  assert.equal(placeToolbar({ top: 10, left: 0, width: 1000, height: 790 }, bar, viewport, 0, 8).side, "inside");
});

test("the toolbar clears a sticky header", () => {
  const placed = placeToolbar({ top: 90, left: 0, width: 400, height: 200 }, { width: 200, height: 36 }, { width: 1000, height: 800 }, 80, 8);
  assert.equal(placed.side, "below");
});
