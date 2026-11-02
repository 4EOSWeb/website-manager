import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createIcon, iconIsDecorative } from "../../src/platform/elements/icon.ts";
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

function readProps(value: unknown) {
  if (!value || typeof value !== "object" || !("props" in value)) return {};
  const props = (value as { props?: unknown }).props;
  return props && typeof props === "object" ? props as Record<string, unknown> : {};
}

test("an icon is decorative until it has a label, and it is not an icon button", () => {
  const icon = createIcon();
  assert.equal(nodeSchema.safeParse(icon).success, true);
  assert.equal(icon.type, "icon");
  assert.equal(icon.componentId, "generic.icon");
  assert.deepEqual(icon.props, { name: "arrow", label: "" });
  assert.equal(iconIsDecorative(icon), true);
  const named = createIcon();
  named.props = { ...named.props, label: "Next" };
  assert.equal(iconIsDecorative(named), false);
  const button = createIconButton();
  assert.equal(button.type, "button");
  assert.equal(button.componentId, "generic.icon-button");
  assert.equal(button.props.icon, "arrow");
  assert.equal(button.props.variant, "icon");
  assert.notEqual(icon.componentId, button.componentId);
  const source = readFileSync(new URL("../../src/platform/elements/icon.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});

test("the serializer stores the icon name", () => {
  const icon = createIcon();
  const root = node("node_a10000000002", "section", { children: [icon] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const blocks = site.pages[0].sections[0].blocks;
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].kind, "paragraph");
  assert.equal(blocks[0].text.text, "arrow");
  assert.equal(readProps(icon).name, "arrow");
});
