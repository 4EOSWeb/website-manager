import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { quantumAgeHero } from "../../adapters/quantum-age/components/hero.ts";
import { labeledNodeTypes, layerNodeLabel, typeLabel } from "../../src/components/editor/layers/labels.ts";
import { nodeTypes } from "../../src/platform/document/node-type.ts";

test("a heading row says Heading unless it was renamed", () => {
  assert.equal(layerNodeLabel({ type: "heading" }), "Heading");
  assert.equal(layerNodeLabel({ type: "heading", metadata: { name: "Intro" } }), "Intro");
  assert.equal(layerNodeLabel({ type: "heading", metadata: { name: "  " } }), "Heading");
});

test("custom rows use the registry display name and that name is not hardcoded", () => {
  const source = readFileSync(new URL("../../src/components/editor/layers/labels.ts", import.meta.url), "utf8");
  assert.equal(source.toLowerCase().includes("quantum"), false);
  assert.equal(source.includes(quantumAgeHero.id), false);
  assert.equal(source.includes(quantumAgeHero.name), false);
  assert.equal(layerNodeLabel({ type: "custom" }, quantumAgeHero.name), quantumAgeHero.name);
  assert.equal(layerNodeLabel({ type: "custom", metadata: { name: "Home opener" } }, quantumAgeHero.name), "Home opener");
});

test("node types and paragraph and canvas have words", () => {
  for (const type of nodeTypes) assert.notEqual(typeLabel(type), type);
  assert.equal(typeLabel("paragraph"), "Paragraph");
  assert.equal(typeLabel("button"), "Button");
  assert.equal(typeLabel("image"), "Image");
  assert.equal(typeLabel("section"), "Section");
  assert.equal(typeLabel("stack"), "Stack");
  assert.equal(typeLabel("grid"), "Grid");
  assert.equal(typeLabel("canvas"), "Canvas");
  assert.equal(typeLabel("group"), "Group");
  assert.equal(typeLabel("unknown-type"), "unknown-type");
  assert.ok(labeledNodeTypes.includes("heading"));
});
