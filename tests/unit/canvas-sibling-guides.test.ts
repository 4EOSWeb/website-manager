import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { siblingGuides } from "../../src/platform/canvas/guides-sibling.ts";
import { centerGuides } from "../../src/platform/canvas/guides-center.ts";
import { edgeGuides } from "../../src/platform/canvas/guides-edge.ts";

test("aligning two nodes shows a guide", () => {
  const aligned = siblingGuides(
    { x: 10, y: 12, w: 20, h: 10 },
    [{ x: 10.4, y: 40, w: 30, h: 12 }],
  );
  assert.equal(aligned.guides.some((guide) => guide.axis === "x"), true);
  const centers = siblingGuides(
    { x: 10, y: 10, w: 20, h: 10 },
    [{ x: 8, y: 4, w: 25, h: 22 }],
  );
  assert.equal(centers.guides.some((guide) => guide.axis === "x" && Math.abs(guide.at - 20.5) < 0.001), true);
  assert.equal(centers.guides.some((guide) => guide.axis === "y"), true);
});

test("hidden siblings do not show a guide", () => {
  const hidden = siblingGuides(
    { x: 10, y: 12, w: 20, h: 10 },
    [{ x: 10.4, y: 40, w: 30, h: 12, hidden: true }],
  );
  assert.deepEqual(hidden.guides, []);
  const center = centerGuides({ x: 31.5, y: 10, w: 36, h: 28 }, false);
  assert.equal(center.vertical, true);
  const edge = edgeGuides({ x: 0.6, y: 20, w: 36, h: 28 }, false);
  assert.equal(edge.left, true);
  assert.equal(edge.box.x, 0);
  const source = readFileSync(new URL("../../src/platform/canvas/guides-sibling.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const script = readFileSync(new URL("../../overlays/quantum-age/src/components/site/canvas-script.ts", import.meta.url), "utf8");
  assert.equal(script.includes('data-guide", axis === "x" ? "sibling-x"'), true);
  assert.equal(script.includes('setAttribute("data-guide", "center-x")'), true);
  assert.equal(script.includes('line("edge-left"'), true);
});
