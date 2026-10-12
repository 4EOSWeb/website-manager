import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { overflowWarning } from "../../src/platform/canvas/overflow.ts";

test("overflowing text raises a warning and the label stays", () => {
  const label = "Supercalifragilistic";
  const warning = overflowWarning({ textWidth: 240, textHeight: 24, nodeWidth: 40, nodeHeight: 28, parentWidth: 800, parentHeight: 400 });
  assert.equal(warning, "This item extends outside its section.");
  assert.equal(label, "Supercalifragilistic");
  const pastParent = overflowWarning({ textWidth: 900, textHeight: 24, nodeWidth: 1000, nodeHeight: 80, parentWidth: 800, parentHeight: 400 });
  assert.equal(pastParent, "This item extends outside its section.");
});

test("short labels show no overflow warning", () => {
  assert.equal(overflowWarning({ textWidth: 80, textHeight: 24, nodeWidth: 200, nodeHeight: 80, parentWidth: 800, parentHeight: 400 }), null);
  assert.equal(overflowWarning({ textWidth: 201, textHeight: 24, nodeWidth: 200, nodeHeight: 80, parentWidth: 800, parentHeight: 400 }), null);
  const source = readFileSync(new URL("../../src/platform/canvas/overflow.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  assert.equal(shell.includes("overflowWarning"), true);
  const script = readFileSync(new URL("../../overlays/quantum-age/src/components/site/canvas-script.ts", import.meta.url), "utf8");
  const start = script.indexOf("function reportOverflow");
  const slice = script.slice(start, script.indexOf("function clearSelected"));
  assert.equal(slice.includes('type: "4eos-overflow"'), true);
  assert.equal(slice.includes("hidden"), false);
  assert.equal(slice.includes("textContent"), false);
});
