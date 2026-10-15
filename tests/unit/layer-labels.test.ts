import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { quantumAgeHero } from "../../adapters/quantum-age/components/hero.ts";
import { labeledNodeTypes, layerIdText, layerNodeLabel, layoutModeLabel, managedLabel, typeLabel } from "../../src/components/editor/layers/labels.ts";
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

test("basic layers hide component ids and advanced layers show them", () => {
  const button = { id: "node_button", componentId: "generic.button" };
  assert.equal(layerIdText("basic", button), "");
  assert.equal(layerIdText("advanced", button), "generic.button");
  assert.equal(layerIdText("administrator", button), "generic.button");
  assert.equal(layerIdText("advanced", { id: "blk_who_h" }), "blk_who_h");
  assert.equal(layerIdText("basic", { id: "blk_who_h", componentId: "generic.button" }), "");
});

test("containers show a layout mode and other nodes do not", () => {
  assert.equal(layoutModeLabel({ type: "section", layout: { mode: "canvas" } }), "Canvas");
  assert.equal(layoutModeLabel({ type: "section", layout: { mode: "layout", display: "flex" } }), "Stack");
  assert.equal(layoutModeLabel({ type: "section", layout: { mode: "layout", display: "grid" } }), "Grid");
  assert.equal(layoutModeLabel({ type: "section", layout: { mode: "flow" } }), "Flow");
  assert.equal(layoutModeLabel({ type: "paragraph" }), "");
  assert.equal(typeLabel("heading"), "Heading");
});

test("provider-managed rows say Managed and a paragraph does not", () => {
  assert.equal(managedLabel(true), "Managed");
  assert.equal(managedLabel(false), "");
});
