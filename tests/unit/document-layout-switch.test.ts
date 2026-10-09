import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutSchema, switchLayout } from "../../src/platform/document/layout.ts";

const flow = { mode: "flow" as const, direction: "vertical" as const, gap: 12 };
const canvas = { mode: "canvas" as const, snap: 8, showGrid: true };

test("switching layout stores the previous settings and keeps child boxes", () => {
  const box = { x: 10, y: 20, w: 30, h: 40 };
  const node = { layout: flow, box, children: [{ id: "node_aaaaaaaaaaaa", box }] };
  const onCanvas = switchLayout(node, canvas);
  assert.equal(onCanvas.layout?.mode, "canvas");
  assert.deepEqual(onCanvas.layout?.previous, flow);
  assert.deepEqual(onCanvas.box, box);
  assert.deepEqual(onCanvas.children[0]?.box, box);

  const restored = switchLayout(onCanvas, onCanvas.layout!.previous!);
  assert.equal(restored.layout?.mode, "flow");
  assert.equal(restored.layout && "direction" in restored.layout ? restored.layout.direction : undefined, "vertical");
  assert.deepEqual(restored.box, box);
  assert.deepEqual(restored.children[0]?.box, box);
  assert.equal(restored.layout?.previous && "previous" in restored.layout.previous, false);

  const nested = layoutSchema.parse({
    ...canvas,
    previous: { ...flow, previous: { mode: "flow", direction: "horizontal", gap: 4 } },
  });
  assert.equal(nested.previous && "previous" in nested.previous, false);
  assert.equal(nested.previous?.mode, "flow");
});
