import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { previewAutoScroll as platformScroll, PREVIEW_SCROLL_EDGE_PX } from "../../src/platform/drag/autoscroll.ts";
import { previewAutoScroll as previewScroll } from "../../overlays/quantum-age/src/components/site/canvas/gesture.ts";

const port = { x: 0, y: 0, width: 400, height: 800 };

test("a pointer within 24 pixels of the preview edge scrolls that way", () => {
  assert.equal(PREVIEW_SCROLL_EDGE_PX, 24);
  const bottom = platformScroll({ x: 200, y: 790 }, port, true);
  assert.ok(bottom.y > 0);
  assert.equal(bottom.x, 0);
  const top = platformScroll({ x: 200, y: 8 }, port, true);
  assert.ok(top.y < 0);
  const left = platformScroll({ x: 6, y: 400 }, port, true);
  assert.ok(left.x < 0);
  assert.equal(left.y, 0);
  const edge = platformScroll({ x: 200, y: 800 - PREVIEW_SCROLL_EDGE_PX }, port, true);
  assert.equal(edge.y, 1);
  const outsideEdge = platformScroll({ x: 200, y: 800 - PREVIEW_SCROLL_EDGE_PX - 1 }, port, true);
  assert.equal(outsideEdge.y, 0);
  assert.deepEqual(platformScroll({ x: 200, y: 400 }, port, true), { x: 0, y: 0 });
});

test("scrolling stops when the drag ends and ignores the hub", () => {
  assert.deepEqual(platformScroll({ x: 200, y: 790 }, port, false), { x: 0, y: 0 });
  const hub = platformScroll({ x: -30, y: 790 }, port, true);
  assert.deepEqual(hub, { x: 0, y: 0 });
  const samples = [
    [{ x: 200, y: 790 }, true],
    [{ x: 200, y: 8 }, true],
    [{ x: 6, y: 400 }, true],
    [{ x: 390, y: 400 }, true],
    [{ x: 200, y: 400 }, true],
    [{ x: 200, y: 790 }, false],
    [{ x: -30, y: 12 }, true],
  ] as const;
  for (const [pointer, dragging] of samples) {
    assert.deepEqual(previewScroll(pointer, port, dragging), platformScroll(pointer, port, dragging));
  }
  const script = readFileSync(new URL("../../src/platform/canvas/runtime.ts", import.meta.url), "utf8");
  assert.equal(script.includes("H.previewAutoScroll"), true);
  assert.equal(script.includes("window.scrollBy(step.x, step.y)"), true);
  assert.equal(script.includes("autoScrollStep(lastPointer.y, window.innerHeight, 56, 18)"), false);
  const source = readFileSync(new URL("../../src/platform/drag/autoscroll.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
