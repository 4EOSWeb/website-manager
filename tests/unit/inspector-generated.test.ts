import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inspectorFields } from "../../src/platform/registry/inspector-fields.ts";
import { propsSchemaFor } from "../../src/platform/elements/props-schemas.ts";
import { generatedName, renameGeneratedNode, type GeneratedNode } from "../../src/components/editor/inspector/generated-model.ts";

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
