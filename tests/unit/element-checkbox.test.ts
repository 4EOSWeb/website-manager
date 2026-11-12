import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCheckbox, checkboxParents } from "../../src/platform/elements/checkbox.ts";
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

test("a checkbox starts unchecked and is not the review confirmation", () => {
  const checkbox = createCheckbox();
  assert.equal(nodeSchema.safeParse(checkbox).success, true);
  assert.equal(checkbox.type, "checkbox");
  assert.equal(checkbox.props.checked, false);
  assert.deepEqual(checkbox.props, { label: "Option", checked: false });
  assert.equal(assertParent(checkboxParents, "form").ok, true);
  assert.equal(assertParent(checkboxParents, "heading").ok, false);
  const form = { ...createForm(), children: [checkbox] };
  const root = node("node_a10000000002", "section", { children: [form] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const next = insertNode(document, "/", form.id, checkbox) as { pages: Array<{ root: { children: Array<{ children?: Array<{ id: string }> }> } }> };
  assert.equal(next.pages[0]?.root.children[0]?.children?.some((child) => child.id === checkbox.id), true);
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const section = site.pages[0].sections.find((entry: { type: string }) => entry.type === "form");
  assert.equal(section.fields[0].kind, "checkbox");
  assert.equal(section.fields[0].label, "Option");
  assert.equal(section.fields[0].checked, false);
  const source = readFileSync(new URL("../../src/platform/elements/checkbox.ts", import.meta.url), "utf8");
  assert.equal(source.includes("PublishDialog"), false);
  assert.equal(source.includes("Confirm"), false);
  const dialogs = readFileSync(new URL("../../src/components/editor/dialogs.tsx", import.meta.url), "utf8");
  assert.equal(dialogs.includes("Confirm it’s you"), true);
  assert.equal(dialogs.includes("generic.checkbox"), false);
  const lowered = source.toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(lowered.includes(word), false, word);
  }
});
