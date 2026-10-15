import { test } from "node:test";
import assert from "node:assert/strict";
import { groupByCategory } from "../../src/platform/registry/categories.ts";
import { createRegistry } from "../../src/platform/registry/register.ts";
import type { ComponentDefinition } from "../../src/platform/registry/types.ts";

function definition(id: string, category: string): ComponentDefinition {
  return {
    id,
    name: id,
    category,
    thumbnail: "none",
    defaultProps: {},
    propsSchemaId: "text",
    inspector: "text",
    acceptsChildren: false,
    allowedParents: ["section"],
    capabilities: {},
    locking: { locked: false },
    renderer: { exportName: "Text" },
  };
}

test("sample.text groups under text and an unknown category fails", () => {
  const registry = createRegistry();
  assert.equal(registry.register(definition("sample.text", "text")).ok, true);
  assert.equal(groupByCategory(registry).text[0]?.id, "sample.text");
  assert.equal(groupByCategory(registry).actions.length, 0);
  const rejected = registry.register(definition("sample.card", "Insights"));
  assert.equal(rejected.ok, false);
  if (!rejected.ok) {
    assert.equal(rejected.error.code, "adapter_invalid");
    assert.equal(rejected.error.path, "components");
  }
  assert.equal(registry.get("sample.card"), undefined);
});
