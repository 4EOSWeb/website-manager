import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGrid } from "../../src/platform/elements/grid.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { serializeQuantumAge } from "../../adapters/quantum-age/serialize.ts";
import { fakeContext } from "./platform-helpers.ts";

function node(id: string, type: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type,
    componentId: type,
    props: {} as Record<string, unknown>,
    styles: {},
    responsive: {},
    children: [] as Array<Record<string, unknown>>,
    visibility: { hidden: false, hideOn: [] as string[] },
    locked: { locked: false },
    metadata: {},
    ...extra,
  };
}

test("a grid starts at two columns and writes no preset id", () => {
  const grid = createGrid();
  assert.equal(nodeSchema.safeParse(grid).success, true);
  assert.equal(grid.type, "grid");
  assert.deepEqual(grid.children, []);
  assert.equal(grid.layout && "columns" in grid.layout ? grid.layout.columns : 0, 2);
  const root = node("node_a10000000002", "section", { children: [grid] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const section = site.pages[0].sections[0];
  assert.equal(section.type, "flow");
  assert.equal(section.layout, "grid");
  assert.equal(section.preset, undefined);
  assert.equal(JSON.stringify(section).includes("quantum-age.card"), false);
  const source = readFileSync(new URL("../../src/platform/elements/grid.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark", "preset"]) {
    assert.equal(source.includes(word), false, word);
  }
});
