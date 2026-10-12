import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSelect, selectParents } from "../../src/platform/elements/select.ts";
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

test("a select stores two generic options", () => {
  const select = createSelect();
  assert.equal(nodeSchema.safeParse(select).success, true);
  assert.equal(select.type, "select");
  assert.equal(select.props.label, "Choose");
  assert.deepEqual(select.props.options, ["First", "Second"]);
  assert.equal(assertParent(selectParents, "form").ok, true);
  assert.equal(assertParent(selectParents, "heading").ok, false);
  const form = { ...createForm(), children: [select] };
  const root = node("node_a10000000002", "section", { children: [form] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const next = insertNode(document, "/", form.id, select) as { pages: Array<{ root: { children: Array<{ children?: Array<{ id: string }> }> } }> };
  assert.equal(next.pages[0]?.root.children[0]?.children?.some((child) => child.id === select.id), true);
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const section = site.pages[0].sections.find((entry: { type: string }) => entry.type === "form");
  assert.equal(section.nameLabel, "Name");
  assert.equal(section.emailLabel, "Email");
  assert.equal(section.messageLabel, "Message");
  assert.equal(section.fields[0].kind, "select");
  assert.deepEqual(section.fields[0].options, ["First", "Second"]);
  const source = readFileSync(new URL("../../src/platform/elements/select.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark", "service"]) {
    assert.equal(source.includes(word), false, word);
  }
});
