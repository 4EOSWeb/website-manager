import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRegistry } from "../../src/platform/registry/register.ts";
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
