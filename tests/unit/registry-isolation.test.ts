import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { registryFromAdapter } from "../../src/platform/registry/discover.ts";
import type { ComponentDefinition } from "../../src/platform/registry/types.ts";

function component(id: string, category: string): ComponentDefinition {
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

test("two adapters keep separate component registries", () => {
  const first = registryFromAdapter({ components: { components: [component("a.button", "actions")] } });
  const second = registryFromAdapter({ components: { components: [component("b.card", "content")] } });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (first.ok && second.ok) {
    assert.deepEqual(first.value.list().map((item) => item.id), ["a.button"]);
    assert.deepEqual(second.value.list().map((item) => item.id), ["b.card"]);
    assert.equal(first.value.get("b.card"), undefined);
    assert.equal(second.value.get("a.button"), undefined);
  }
  const source = readFileSync(new URL("../../src/platform/registry/register.ts", import.meta.url), "utf8");
  assert.equal(source.includes("export const registry"), false);
  assert.equal(source.match(/new Map/g)?.length, 1);
  const scan = spawnSync("rg", ["-i", "quantum|insights", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
