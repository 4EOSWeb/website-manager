import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCard } from "../../src/platform/elements/card.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { serializeQuantumAge } from "../../adapters/quantum-age/serialize.ts";
import { fakeContext } from "./platform-helpers.ts";

function readProps(value: unknown) {
  if (!value || typeof value !== "object" || !("props" in value)) return {};
  const props = (value as { props?: unknown }).props;
  return props && typeof props === "object" ? props as Record<string, unknown> : {};
}

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

test("a card uses generic copy and not a site card component", () => {
  const card = createCard();
  assert.equal(nodeSchema.safeParse(card).success, true);
  assert.equal(card.componentId, "generic.card");
  assert.equal(card.children.length, 2);
  assert.equal(readProps(card.children[0]).text, "Card title");
  assert.equal(readProps(card.children[1]).text, "Card text");
  const siteCard = node("node_a10000000008", "custom", { componentId: "quantum-age.card", props: { heading: "Access leading experts" } });
  const root = node("node_a10000000002", "section", { children: [siteCard, card] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const blocks = site.pages[0].sections[0].blocks;
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].kind, "card");
  assert.equal(blocks[0].text.text, "Card title");
  assert.equal(blocks[0].detail.text, "Card text");
  assert.equal(JSON.stringify(blocks).includes("quantum-age.card"), false);
  const source = readFileSync(new URL("../../src/platform/elements/card.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
