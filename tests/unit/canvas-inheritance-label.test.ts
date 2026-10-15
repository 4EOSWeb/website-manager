import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inheritanceLabelText } from "../../src/components/editor/inspector/inheritance-text.ts";

const box = { x: 10, y: 12, w: 20, h: 8 };

test("a missing mobile key inherits, and a mobile box is custom", () => {
  const desktopOnly = { box, responsive: {} };
  assert.equal(inheritanceLabelText({ mode: "canvas", breakpoint: "mobile", node: desktopOnly }), "Inherits from desktop");
  assert.equal(inheritanceLabelText({ mode: "canvas", breakpoint: "tablet", node: desktopOnly }), "Inherits from desktop");
  assert.equal(inheritanceLabelText({ mode: "canvas", breakpoint: "desktop", node: desktopOnly }), null);
  assert.equal(inheritanceLabelText({ mode: "flow", breakpoint: "mobile", node: desktopOnly }), null);
  const tabletOnly = { box, responsive: { tablet: { box } } };
  assert.equal(inheritanceLabelText({ mode: "canvas", breakpoint: "mobile", node: tabletOnly }), "Inherits from tablet");
  const custom = { box, responsive: { tablet: { box }, mobile: { box: { x: 40, y: 50, w: 20, h: 8 } } } };
  assert.equal(inheritanceLabelText({ mode: "canvas", breakpoint: "mobile", node: custom }), "Custom position");
  const source = readFileSync(new URL("../../src/components/editor/inspector/inheritance-text.ts", import.meta.url), "utf8");
  const view = readFileSync(new URL("../../src/components/editor/inspector/inheritance-label.tsx", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  assert.equal(view.includes("overlays/"), false);
  assert.equal(source.includes("inheritedBreakpoints"), true);
  assert.equal(view.includes("data-inheritance"), true);
  assert.equal(view.includes('mode === "flow"') || source.includes('mode === "flow"'), true);
  for (const file of [source, view]) {
    for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
      assert.equal(file.toLowerCase().includes(word), false, word);
    }
  }
});
