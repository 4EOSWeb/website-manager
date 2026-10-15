import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createStack } from "../../src/platform/elements/stack.ts";
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

test("a stack starts as a column and is not a preset", () => {
  const stack = createStack();
  assert.equal(nodeSchema.safeParse(stack).success, true);
  assert.equal(stack.type, "stack");
  assert.equal(stack.componentId, "generic.stack");
  assert.equal(stack.layout && "direction" in stack.layout ? stack.layout.direction : "", "column");
  const row = createStack();
  row.layout = { mode: "layout", display: "flex", direction: "row", gap: 16, align: "stretch", justify: "start", wrap: false };
  assert.equal(nodeSchema.safeParse(row).success, true);
  const root = node("node_a10000000002", "section", { children: [stack] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const section = site.pages[0].sections[0];
  assert.equal(section.type, "flow");
  assert.equal(section.editorName, "Stack");
  assert.equal(section.preset, undefined);
  assert.equal(JSON.stringify(section).includes("split"), false);
  const source = readFileSync(new URL("../../src/platform/elements/stack.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark", "preset"]) {
    assert.equal(source.includes(word), false, word);
  }
});
