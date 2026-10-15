import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRegistry } from "../../src/platform/registry/register.ts";
import { registryFromAdapter } from "../../src/platform/registry/discover.ts";
import type { ComponentDefinition } from "../../src/platform/registry/types.ts";

function definition(id: string): ComponentDefinition {
  return {
    id,
    name: id,
    category: "text",
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

test("registries keep their own components", () => {
  const first = createRegistry();
  const second = createRegistry();
  assert.equal(first.register(definition("sample.text")).ok, true);
  assert.equal(first.get("sample.text")?.id, "sample.text");
  assert.equal(second.get("sample.text"), undefined);
  assert.equal(second.list().length, 0);
  const library = readFileSync(new URL("../../src/lib/library.ts", import.meta.url), "utf8");
  assert.equal(library.includes('id: "layout:hero"'), true);
  assert.equal(library.includes('id: "block:paragraph"'), true);
});

test("a repeated id is rejected and case is significant", () => {
  const registry = createRegistry();
  assert.equal(registry.register(definition("sample.text")).ok, true);
  const again = registry.register({ ...definition("sample.text"), name: "Other" });
  assert.equal(again.ok, false);
  if (!again.ok) {
    assert.equal(again.error.code, "adapter_invalid");
    assert.equal(again.error.path, "components");
  }
  assert.equal(registry.get("sample.text")?.name, "sample.text");
  assert.equal(registry.register(definition("Sample.text")).ok, true);
  const loaded = registryFromAdapter({
    components: { components: [definition("sample.text"), definition("sample.text")] },
  });
  assert.equal(loaded.ok, false);
  if (!loaded.ok) assert.equal(loaded.error.path, "components");
});
