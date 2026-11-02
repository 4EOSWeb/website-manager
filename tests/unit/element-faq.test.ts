import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createFaq } from "../../src/platform/elements/faq.ts";
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

test("an FAQ has one item and does not add a route", () => {
  const faq = createFaq();
  assert.equal(nodeSchema.safeParse(faq).success, true);
  assert.deepEqual(faq.props.items, [{ q: "Question", a: "Answer" }]);
  const root = node("node_a10000000002", "section", { children: [faq] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  assert.equal(site.pages.length, 1);
  assert.equal(site.pages[0].route, "/");
  const section = site.pages[0].sections.find((entry: { type: string }) => entry.type === "faq");
  assert.equal(section.items.length, 1);
  assert.equal(section.items[0].q, "Question");
  const source = readFileSync(new URL("../../src/platform/elements/faq.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
