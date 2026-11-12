import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canvasZ, paintOrder, setCanvasZ } from "../../src/platform/canvas/z-index.ts";

test("a node with z 2 paints above z 1 and the value persists", () => {
  const lower = setCanvasZ({ id: "node_a10000000001", metadata: {} }, 1);
  const upper = setCanvasZ({ id: "node_a10000000002", metadata: {} }, 2);
  assert.equal(canvasZ(upper.metadata), 2);
  assert.equal(canvasZ(setCanvasZ(upper, 2).metadata), 2);
  const painted = paintOrder([upper, lower], true);
  assert.deepEqual(painted.map((node) => node.id), ["node_a10000000001", "node_a10000000002"]);
  const kept = setCanvasZ(upper, 201);
  assert.equal(canvasZ(kept.metadata), 2);
  assert.equal(setCanvasZ(lower, -1), lower);
  assert.equal(setCanvasZ(lower, 1.5), lower);
});

test("flow order is unchanged by z", () => {
  const first = { id: "node_a10000000003", metadata: { z: 9 } };
  const second = { id: "node_a10000000004", metadata: { z: 1 } };
  assert.deepEqual(paintOrder([first, second], false).map((node) => node.id), ["node_a10000000003", "node_a10000000004"]);
  const source = readFileSync(new URL("../../src/platform/canvas/z-index.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const view = readFileSync(new URL("../../overlays/quantum-age/src/components/site/section-view.tsx", import.meta.url), "utf8");
  assert.equal(view.includes("left.item.zIndex - right.item.zIndex"), true);
  assert.equal(view.includes("data-z={item.zIndex}"), true);
});
