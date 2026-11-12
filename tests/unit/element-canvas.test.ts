import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCanvas } from "../../src/platform/elements/canvas.ts";
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

test("a canvas uses canvas layout and keeps its id on the freeform section", () => {
  const canvas = createCanvas();
  assert.equal(nodeSchema.safeParse(canvas).success, true);
  assert.equal(canvas.layout && "mode" in canvas.layout ? canvas.layout.mode : "", "canvas");
  assert.deepEqual(canvas.layout, { mode: "canvas", snap: 4, showGrid: false });
  assert.equal(canvas.metadata.sourceNode, canvas.id);
  const root = node("node_a10000000002", "section", { children: [canvas] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const section = site.pages[0].sections[0];
  assert.equal(section.type, "freeform");
  assert.equal(section.name, "Canvas");
  assert.equal(section.metadata.sourceNode, canvas.id);
  const library = readFileSync(new URL("../../src/lib/library.ts", import.meta.url), "utf8");
  const generic = readFileSync(new URL("../../src/components/editor/library.tsx", import.meta.url), "utf8");
  assert.equal(library.includes('id: "section:freeform"'), true);
  assert.equal(generic.includes('label: "Canvas"'), true);
  assert.equal(generic.includes('id: "element:canvas"'), true);
  const source = readFileSync(new URL("../../src/platform/elements/canvas.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
