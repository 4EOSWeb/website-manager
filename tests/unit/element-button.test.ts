import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buttonDefaults, createButton, writeButtonField } from "../../src/platform/elements/button.ts";
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

test("a button node is new and does not use the header label", () => {
  const first = createButton();
  const second = createButton();
  assert.equal(nodeSchema.safeParse(first).success, true);
  assert.equal(first.type, "button");
  assert.equal(first.componentId, "generic.button");
  assert.equal(first.props.label, "Button");
  assert.equal(first.props.href, "/");
  assert.equal(first.props.target, "same");
  assert.equal(first.props.variant, "filled");
  assert.equal(first.props.size, "m");
  assert.equal(first.props.icon, "none");
  assert.equal(first.props.iconPosition, "end");
  assert.equal(first.props.align, "start");
  assert.equal(first.props.width, "auto");
  assert.deepEqual(first.props.hideOn, []);
  assert.deepEqual(first.props.hover, {});
  assert.deepEqual(first.props.focus, {});
  assert.deepEqual(first.props.disabled, {});
  assert.equal(first.props.font, "");
  assert.notEqual(first.id, second.id);
  assert.match(first.id, /^node_[0-9a-f]{12}$/);
  assert.equal(first.props.label, buttonDefaults.label);
  const source = readFileSync(new URL("../../src/platform/elements/button.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
  const catalog = readFileSync(new URL("../../src/components/editor/library.tsx", import.meta.url), "utf8");
  assert.match(catalog, /createButton\(\)/);
  assert.match(catalog, /id: "element:button"/);
});

test("changing one button label leaves the header and the other button alone", () => {
  const created = createButton();
  const other = node("node_a10000000005", "button", { componentId: "generic.button", props: { ...buttonDefaults, label: "Keep this" } });
  const root = node("node_a10000000002", "section", { children: [other, created] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const next = writeButtonField(document, created.id, "label", "Talk soon") as typeof document;
  assert.equal(readProps(next.pages[0]?.root.children[1]).label, "Talk soon");
  assert.equal(readProps(next.pages[0]?.root.children[0]).label, "Keep this");
  assert.equal(readProps(document.pages[0]?.root.children[1]).label, "Button");
  assert.equal(writeButtonField(document, created.id, "href", "javascript:alert(1)"), null);

  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const blocks = site.pages[0].sections[0].blocks;
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].kind, "button");
  assert.equal(blocks[0].text.text, "Keep this");
  assert.equal(blocks[1].text.text, "Button");
  assert.equal(blocks[1].href, "/");
  assert.equal(site.chrome.header.buttonLabel, "Start a conversation");
  assert.equal(site.chrome.header.buttonHref, "/contact");
});
