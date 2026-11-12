import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { alignBoxes } from "../../src/platform/canvas/align.ts";
import { distributeBoxes, distributeCanvas } from "../../src/platform/canvas/distribute.ts";

const heading = { x: 5, y: 10, w: 10, h: 8 };
const image = { x: 30, y: 40, w: 10, h: 12 };
const button = { x: 80, y: 70, w: 10, h: 6 };
const bystander = { x: 4, y: 4, w: 6, h: 6 };

function gap(boxes: { x: number; y: number; w: number; h: number }[], axis: "x" | "y") {
  const sorted = boxes.slice().sort((left, right) => left[axis] - right[axis]);
  const gaps: number[] = [];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    if (!current || !next) continue;
    gaps.push(axis === "x" ? next.x - (current.x + current.w) : next.y - (current.y + current.h));
  }
  return gaps;
}

test("three nodes end with equal gaps and two nodes stay put", () => {
  const horizontal = distributeBoxes([heading, image, button], "horizontal");
  const gaps = gap(horizontal, "x");
  assert.equal(gaps.length, 2);
  assert.ok(Math.abs((gaps[0] ?? 0) - (gaps[1] ?? 0)) <= 1, String(gaps));
  assert.equal(horizontal[0]?.x, 5);
  assert.equal(horizontal[2]?.x, 80);
  const two = distributeBoxes([heading, image], "horizontal");
  assert.deepEqual(two, [heading, image]);
  assert.equal(heading.x, 5);
  const vertical = distributeBoxes([heading, image, button], "vertical");
  const verticalGaps = gap(vertical, "y");
  assert.ok(Math.abs((verticalGaps[0] ?? 0) - (verticalGaps[1] ?? 0)) <= 1);
  const aligned = alignBoxes(horizontal, "left");
  assert.equal(aligned[0]?.x, aligned[1]?.x);
  assert.equal(aligned[1]?.x, aligned[2]?.x);
});

test("a node outside the selection is not distributed", () => {
  const document = {
    pages: [{
      root: {
        id: "node_a10000000001",
        children: [
          { id: "node_a10000000002", box: heading },
          { id: "node_a10000000003", box: image },
          { id: "node_a10000000004", box: button },
          { id: "node_a10000000005", box: bystander },
        ],
      },
    }],
  };
  const distributed = distributeCanvas(structuredClone(document), ["node_a10000000002", "node_a10000000003", "node_a10000000004"], "horizontal");
  assert.equal(distributed?.ok, true);
  if (!distributed || !distributed.ok) return;
  const children = (distributed.document as typeof document).pages[0]?.root.children ?? [];
  assert.deepEqual(children[3]?.box, bystander);
  assert.equal(distributeCanvas(document, ["node_a10000000002", "node_a10000000003"], "horizontal")?.ok, false);
  assert.equal(distributeCanvas(null, ["node_a10000000002", "node_a10000000003", "node_a10000000004"], "horizontal"), null);
  const source = readFileSync(new URL("../../src/platform/canvas/distribute.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
