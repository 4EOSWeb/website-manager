import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sample from "../fixtures/adapters/sample/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { createForm, formEntryVisible } from "../../src/platform/elements/form.ts";
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

test("a form stays generic and a level 1 adapter hides the catalog entry", () => {
  assert.equal(formEntryVisible(sample), false);
  assert.equal(formEntryVisible(quantumAgeAdapter), true);
  assert.equal(formEntryVisible(JSON.parse(JSON.stringify(quantumAgeAdapter))), true);
  const form = createForm();
  assert.equal(nodeSchema.safeParse(form).success, true);
  assert.equal(form.props.recipient, "");
  assert.equal(form.props.nameLabel, "Name");
  assert.equal(form.props.emailLabel, "Email");
  assert.equal(form.props.messageLabel, "Message");
  assert.equal(form.props.buttonLabel, "Send");
  const root = node("node_a10000000002", "section", { children: [form] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const section = site.pages[0].sections.find((entry: { type: string }) => entry.type === "form");
  assert.equal(section.recipient, "");
  assert.equal(section.buttonLabel, "Send");
  const source = readFileSync(new URL("../../src/platform/elements/form.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
