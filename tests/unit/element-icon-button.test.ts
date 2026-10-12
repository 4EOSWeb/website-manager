import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createButton } from "../../src/platform/elements/button.ts";
import { createIconButton } from "../../src/platform/elements/icon-button.ts";
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

test("an icon button is distinct and its label is the accessible name", () => {
  const icon = createIconButton();
  const text = createButton();
  assert.equal(nodeSchema.safeParse(icon).success, true);
  assert.equal(icon.type, "button");
  assert.equal(icon.componentId, "generic.icon-button");
  assert.notEqual(icon.componentId, text.componentId);
  assert.equal(icon.props.variant, "icon");
  assert.equal(icon.props.icon, "arrow");
  assert.notEqual(icon.props.icon, "none");
  assert.equal(icon.props.label, "Icon button");
  assert.equal(text.props.label, "Button");
  assert.equal(text.props.icon, "none");
  const source = readFileSync(new URL("../../src/platform/elements/icon-button.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});

test("the serializer writes the icon and leaves a text button label alone", () => {
  const icon = createIconButton();
  const text = createButton();
  const root = node("node_a10000000002", "section", { children: [text, icon] });
  const result = serializeQuantumAge(
    { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] },
    fakeContext("web_quantum_age"),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const blocks = site.pages[0].sections[0].blocks;
  assert.equal(blocks[0].text.text, "Button");
  assert.equal(blocks[0].icon, "none");
  assert.equal(blocks[1].kind, "button");
  assert.equal(blocks[1].icon, "arrow");
  assert.equal(blocks[1].variant, "icon");
  assert.equal(blocks[1].text.text, "Icon button");
});
