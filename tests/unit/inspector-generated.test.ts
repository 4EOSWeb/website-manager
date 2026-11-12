import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inspectorFields } from "../../src/platform/registry/inspector-fields.ts";
import { propsSchemaFor } from "../../src/platform/elements/props-schemas.ts";
import { generatedName, isContentProp, renameGeneratedNode, writeGeneratedProp, type GeneratedNode } from "../../src/components/editor/inspector/generated-model.ts";

const heading: GeneratedNode = {
  id: "node_heading",
  componentId: "generic.heading",
  metadata: {},
  props: { text: "Heading", level: 2 },
};

test("a generic heading has a name field and a read-only id", () => {
  const renamed = renameGeneratedNode(heading, "Intro");
  assert.equal(generatedName(renamed), "Intro");
  assert.equal(renamed.id, "node_heading");
  assert.equal(renamed.componentId, "generic.heading");
  const schema = propsSchemaFor("generic.heading");
  assert.ok(schema);
  const fields = inspectorFields(schema).fields.map((field) => field.prop);
  assert.deepEqual(fields, ["text", "level"]);
  const view = readFileSync(new URL("../../src/components/editor/inspector/generated.tsx", import.meta.url), "utf8");
  const panel = readFileSync(new URL("../../src/components/editor/inspector/index.tsx", import.meta.url), "utf8");
  assert.equal(view.includes("inspectorFields"), true);
  assert.equal(view.includes('aria-label="Id"'), true);
  assert.equal(view.includes("readOnly"), true);
  assert.equal(view.includes('aria-label="Name"'), true);
  assert.equal(panel.includes("TextContent"), true);
  assert.equal(panel.includes('data-generated="common"') || view.includes('data-generated="common"'), true);
  assert.equal(view.toLowerCase().includes("quantum"), false);
  const schemas = readFileSync(new URL("../../src/platform/elements/props-schemas.ts", import.meta.url), "utf8");
  assert.equal(schemas.toLowerCase().includes("quantum"), false);
});

test("content props are text, label, quote, and title, and a write touches one prop", () => {
  assert.equal(isContentProp("text", "text"), true);
  assert.equal(isContentProp("label", "text"), true);
  assert.equal(isContentProp("quote", "text"), true);
  assert.equal(isContentProp("title", "text"), true);
  assert.equal(isContentProp("level", "number"), false);
  assert.equal(isContentProp("mode", "select"), false);
  const next = writeGeneratedProp(heading, "text", "Fresh sentence");
  assert.equal(next.props.text, "Fresh sentence");
  assert.equal(next.props.level, 2);
  assert.equal(next.id, heading.id);
  const view = readFileSync(new URL("../../src/components/editor/inspector/generated.tsx", import.meta.url), "utf8");
  assert.equal(view.includes('data-generated-tab="content"'), true);
  assert.equal(view.includes("Flow"), false);
  assert.equal(view.includes("Canvas"), false);
});
