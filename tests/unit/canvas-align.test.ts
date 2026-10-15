import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { alignBoxes, alignCanvas } from "../../src/platform/canvas/align.ts";

const heading = { x: 10, y: 12, w: 20, h: 10 };
const image = { x: 40, y: 30, w: 20, h: 16 };
const button = { x: 8, y: 70, w: 12, h: 8 };

test("align left gives every selected node the same x", () => {
  const aligned = alignBoxes([heading, image], "left");
  assert.equal(aligned[0]?.x, 10);
  assert.equal(aligned[1]?.x, 10);
  assert.equal(aligned[0]?.y, heading.y);
  assert.equal(aligned[1]?.y, image.y);
  assert.equal(heading.x, 10);
});

test("each align action uses the selection bounds and a single node uses the parent", () => {
  assert.equal(alignBoxes([heading, image], "right")[0]?.x, 40);
  assert.equal(alignBoxes([heading, image], "center")[0]?.x, 25);
  assert.equal(alignBoxes([heading, image], "top")[1]?.y, 12);
  assert.equal(alignBoxes([heading, image], "middle")[0]?.y, 24);
  assert.equal(alignBoxes([heading, image], "bottom")[0]?.y, 36);
  const alone = alignBoxes([heading], "left")[0];
  assert.equal(alone?.x, 0);
  assert.equal(alignBoxes([heading], "right")[0]?.x, 80);
  assert.equal(alignBoxes([heading], "center")[0]?.x, 40);
  assert.equal(alignBoxes([heading], "top")[0]?.y, 0);
  assert.equal(alignBoxes([heading], "middle")[0]?.y, 45);
  assert.equal(alignBoxes([heading], "bottom")[0]?.y, 90);
});

test("align leaves a node outside the selection where it was", () => {
  const document = {
    pages: [{
      root: {
        id: "node_a10000000001",
        children: [
          { id: "node_a10000000002", box: heading },
          { id: "node_a10000000003", box: image },
          { id: "node_a10000000004", box: button },
        ],
      },
    }],
  };
  const aligned = alignCanvas(structuredClone(document), ["node_a10000000002", "node_a10000000003"], "left");
  assert.equal(aligned?.ok, true);
  if (!aligned || !aligned.ok) return;
  const children = (aligned.document as typeof document).pages[0]?.root.children ?? [];
  assert.equal(children[0]?.box.x, 10);
  assert.equal(children[1]?.box.x, 10);
  assert.deepEqual(children[2]?.box, button);
  assert.equal(alignCanvas(null, ["node_a10000000002"], "left"), null);
  assert.equal(alignCanvas(document, ["node_a10000000002", "missing"], "left")?.ok, false);
  const source = readFileSync(new URL("../../src/platform/canvas/align.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
