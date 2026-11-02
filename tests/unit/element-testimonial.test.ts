import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTestimonial } from "../../src/platform/elements/testimonial.ts";
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

test("a testimonial uses generic words", () => {
  const item = createTestimonial();
  assert.equal(nodeSchema.safeParse(item).success, true);
  assert.deepEqual(item.props, { quote: "Quote", name: "Name", role: "Role" });
  const kept = "Quantum Age brings deep expertise and strategic thinking to every engagement. Their collaborative approach made all the difference.";
  const existing = node("node_a10000000009", "custom", { componentId: "quantum-age.card", props: { quote: kept } });
  const root = node("node_a10000000002", "section", { children: [existing, item] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const section = site.pages[0].sections.find((entry: { type: string }) => entry.type === "testimonial");
  assert.equal(section.quote, "Quote");
  assert.equal(section.name, "Name");
  assert.equal(section.role, "Role");
  assert.equal(JSON.stringify(section).includes(kept), false);
  const source = readFileSync(new URL("../../src/platform/elements/testimonial.ts", import.meta.url), "utf8");
  assert.equal(source.includes(kept), false);
  const lowered = source.toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(lowered.includes(word), false, word);
  }
});
