import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canvasFieldsVisible, canvasPercents, writeCanvasPercent } from "../../src/components/editor/inspector/canvas-model.ts";

test("canvas percentages write the active box and stay hidden in flow", () => {
  assert.equal(canvasFieldsVisible("canvas"), true);
  assert.equal(canvasFieldsVisible("freeform"), true);
  assert.equal(canvasFieldsVisible("flow"), false);
  assert.deepEqual(canvasPercents({ x: 0.1, y: 0.2, w: 0.3, h: 0.4 }), { x: 10, y: 20, w: 30, h: 40 });
  const next = writeCanvasPercent({ x: 0, y: 0.08, w: 0.42, h: 0.28 }, "x", "10");
  assert.equal(next?.x, 0.1);
  assert.equal(next?.y, 0.08);
  assert.equal(writeCanvasPercent({ x: 0, y: 0, w: 0.2, h: 0.2 }, "x", "no"), null);
  const fields = readFileSync("src/components/editor/inspector/canvas-fields.tsx", "utf8");
  const model = readFileSync("src/components/editor/inspector/canvas-model.ts", "utf8");
  assert.equal(fields.includes('label="X"'), true);
  assert.equal(fields.includes("Bring forward"), true);
  const lowered = `${fields}\n${model}`.toLowerCase();
  assert.equal(lowered.includes("quantum"), false);
  assert.equal(lowered.includes("plum"), false);
  assert.equal(lowered.includes("hero"), false);
  const inspector = readFileSync("src/components/editor/inspector/index.tsx", "utf8");
  assert.equal(inspector.includes("data-canvas-fields"), false);
  const blocks = readFileSync("src/components/editor/inspector/blocks.tsx", "utf8");
  assert.equal(blocks.includes("data-canvas-fields"), false);
});
