import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createDivider } from "../../src/platform/elements/divider.ts";
import { createParagraph } from "../../src/platform/elements/paragraph.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { serializeQuantumAge } from "../../adapters/quantum-age/serialize.ts";
import { fakeContext } from "./platform-helpers.ts";

function node(id: string, type: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type,
    componentId: extra.componentId ?? type,
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

test("a divider is one empty node and leaves neighbor text alone", () => {
  const divider = createDivider();
  assert.equal(nodeSchema.safeParse(divider).success, true);
  assert.equal(divider.type, "divider");
  assert.equal(divider.componentId, "generic.divider");
  assert.deepEqual(divider.children, []);
  assert.deepEqual(divider.props, {});
  const before = createParagraph();
  const after = createParagraph();
  before.props = { text: "First line" };
  after.props = { text: "Second line" };
  const root = node("node_a10000000002", "section", { children: [before, divider, after] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const flow = site.pages[0].sections.find((section: { type: string }) => section.type === "flow");
  const rule = site.pages[0].sections.find((section: { type: string }) => section.type === "divider");
  assert.deepEqual(flow.blocks.map((block: { text: { text: string } }) => block.text.text), ["First line", "Second line"]);
  assert.equal(rule.type, "divider");
  assert.equal(JSON.stringify(rule).includes("First line"), false);
  const source = readFileSync(new URL("../../src/platform/elements/divider.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
