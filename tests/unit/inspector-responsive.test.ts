import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyStrategy, responsiveFieldsVisible, strategyLabel } from "../../src/components/editor/inspector/responsive-model.ts";

test("changing strategy updates the node and flow text stays hidden", () => {
  const button = { id: "item_button", kind: "button", text: "Button", strategy: "reflow" as const };
  const custom = applyStrategy(button, "custom");
  assert.equal(custom.strategy, "custom");
  assert.equal(custom.responsive?.strategy, "custom");
  assert.equal(custom.text, "Button");
  assert.equal(custom.id, "item_button");
  assert.equal(strategyLabel(custom.strategy), "Custom");
  assert.equal(responsiveFieldsVisible({ mode: "canvas" }), true);
  assert.equal(responsiveFieldsVisible({ mode: "canvas", responsive: false }), false);
  assert.equal(responsiveFieldsVisible({ mode: "flow", responsive: true }), false);
  const fields = readFileSync("src/components/editor/inspector/responsive-fields.tsx", "utf8");
  assert.equal(fields.includes("Responsive strategy"), true);
  assert.equal(fields.includes("InheritanceLabel"), true);
  assert.equal(fields.includes("Use inherited position"), true);
  assert.equal(fields.includes("if (!props.visible) return null"), true);
  const lowered = fields.toLowerCase();
  assert.equal(lowered.includes("quantum"), false);
  assert.equal(lowered.includes("plum"), false);
  assert.equal(lowered.includes("hero"), false);
  const textInspector = readFileSync("src/components/editor/inspector/blocks.tsx", "utf8");
  assert.equal(textInspector.includes("data-responsive-fields"), false);
  assert.equal(textInspector.includes("Responsive strategy"), false);
});
