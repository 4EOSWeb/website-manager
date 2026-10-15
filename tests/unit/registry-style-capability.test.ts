import { test } from "node:test";
import assert from "node:assert/strict";
import { canSetStyle } from "../../src/platform/registry/capabilities.ts";
import { createRegistry } from "../../src/platform/registry/register.ts";
import type { ComponentDefinition } from "../../src/platform/registry/types.ts";

function definition(styleKeys: string[] = []): ComponentDefinition {
  return {
    id: "sample.text",
    name: "Text",
    category: "text",
    thumbnail: "none",
    defaultProps: {},
    propsSchemaId: "text",
    inspector: "text",
    acceptsChildren: false,
    allowedParents: ["section"],
    styleKeys,
    capabilities: { styleable: true },
    locking: { locked: false },
    renderer: { exportName: "Text" },
  };
}

test("disallowed style keys fail and an empty styleable list cannot register", () => {
  const styled = { capabilities: { styleable: true }, styleKeys: ["color"] };
  assert.equal(canSetStyle(styled, "color"), true);
  assert.equal(canSetStyle(styled, "width"), false);
  assert.equal(canSetStyle({ capabilities: { styleable: false }, styleKeys: ["color"] }, "color"), false);
  const registry = createRegistry();
  const rejected = registry.register(definition([]));
  assert.equal(rejected.ok, false);
  if (!rejected.ok) {
    assert.equal(rejected.error.code, "adapter_invalid");
    assert.equal(rejected.error.path, "components");
  }
  assert.equal(registry.register(definition(["color"])).ok, true);
});
