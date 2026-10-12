import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createInput, inputParents } from "../../src/platform/elements/input.ts";
import { createForm } from "../../src/platform/elements/form.ts";
import { insertNode } from "../../src/platform/elements/create.ts";
import { assertParent } from "../../src/platform/registry/parents.ts";
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

test("an input can sit in a form and not in a heading", () => {
  const input = createInput();
  assert.equal(nodeSchema.safeParse(input).success, true);
  assert.deepEqual(input.props, { label: "Label", name: "field", required: false });
  assert.equal(assertParent(inputParents, "form").ok, true);
  assert.equal(assertParent(inputParents, "container").ok, true);
  assert.equal(assertParent(inputParents, "heading").ok, false);
  const form = createForm();
  const heading = node("node_a10000000003", "heading", { componentId: "generic.heading", props: { text: "Heading" } });
  const root = node("node_a10000000002", "section", { children: [form, heading] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const next = insertNode(document, "/", form.id, input) as { pages: Array<{ root: { children: Array<{ id: string; children?: Array<{ id: string }> }> } }> };
  assert.equal(next.pages[0]?.root.children[0]?.children?.[0]?.id, input.id);
  assert.equal(next.pages[0]?.root.children[1]?.children?.length ?? 0, 0);
  const result = serializeQuantumAge(next, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const section = site.pages[0].sections.find((entry: { type: string }) => entry.type === "form");
  assert.equal(section.fields[0].label, "Label");
  assert.equal(section.fields[0].kind, "text");
  const source = readFileSync(new URL("../../src/platform/elements/input.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
