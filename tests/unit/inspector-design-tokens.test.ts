import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { quantumAgeTheme } from "../../adapters/quantum-age/theme.ts";
import { adapterColorTokens, colorTokenOptions, visibleDesignKeys, writeGeneratedStyle, type GeneratedNode } from "../../src/components/editor/inspector/generated-model.ts";

const button: GeneratedNode = {
  id: "node_button",
  componentId: "generic.button",
  metadata: {},
  props: { label: "Button" },
};

test("design token options match the active adapter and a locked component hides design", () => {
  const tokens = adapterColorTokens({ theme: quantumAgeTheme });
  assert.deepEqual(colorTokenOptions(tokens), quantumAgeTheme.tokens.map((token) => token.id));
  assert.deepEqual(visibleDesignKeys({ styleKeys: ["color", "background"], capabilities: { styleable: true }, locking: { locked: false } }), ["color", "background"]);
  assert.deepEqual(visibleDesignKeys({ styleKeys: ["color", "background"], capabilities: { styleable: false }, locking: { locked: true } }), []);
  assert.deepEqual(visibleDesignKeys({ styleKeys: ["opacity"], capabilities: { styleable: true }, locking: { locked: false } }), ["opacity"]);
  const styled = writeGeneratedStyle(button, "background", "token:ink");
  assert.equal(styled.styles?.background, "token:ink");
  assert.equal(styled.props.label, "Button");
  const source = [
    readFileSync(new URL("../../src/components/editor/inspector/generated.tsx", import.meta.url), "utf8"),
    readFileSync(new URL("../../src/components/editor/inspector/generated-model.ts", import.meta.url), "utf8"),
  ].join("\n").toLowerCase();
  assert.equal(source.includes("plum"), false);
  assert.equal(source.includes("green"), false);
  assert.equal(source.includes('data-generated-tab="design"'), true);
});
