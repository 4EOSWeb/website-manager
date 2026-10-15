import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTextarea, textareaParents } from "../../src/platform/elements/textarea.ts";
import { createInput } from "../../src/platform/elements/input.ts";
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

test("a text area is not an input and stays inside the form", () => {
  const area = createTextarea();
  const input = createInput();
  assert.equal(nodeSchema.safeParse(area).success, true);
  assert.equal(area.type, "textarea");
  assert.notEqual(area.type, "input");
  assert.deepEqual(area.props, { label: "Message", name: "message", required: false });
  assert.equal(assertParent(textareaParents, "form").ok, true);
  assert.equal(assertParent(textareaParents, "container").ok, true);
  assert.equal(assertParent(textareaParents, "heading").ok, false);
  const form = { ...createForm(), children: [input, area] };
  const heading = node("node_a10000000003", "heading", { componentId: "generic.heading", props: { text: "Heading" } });
  const root = node("node_a10000000002", "section", { children: [form, heading] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const next = insertNode(document, "/", form.id, area) as { pages: Array<{ root: { children: Array<{ id: string; children?: Array<{ id: string }> }> } }> };
  assert.equal(next.pages[0]?.root.children[0]?.children?.some((child) => child.id === area.id), true);
  assert.equal(next.pages[0]?.root.children[1]?.children?.length ?? 0, 0);
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const section = site.pages[0].sections.find((entry: { type: string }) => entry.type === "form");
  assert.equal(section.fields[0].kind, "text");
  assert.equal(section.fields[0].label, "Label");
  assert.equal(section.fields[1].kind, "textarea");
  assert.equal(section.fields[1].label, "Message");
  const source = readFileSync(new URL("../../src/platform/elements/textarea.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
