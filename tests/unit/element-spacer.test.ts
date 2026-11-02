import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSpacer } from "../../src/platform/elements/spacer.ts";
import { createParagraph } from "../../src/platform/elements/paragraph.ts";
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

test("a spacer defaults to medium and has no text", () => {
  const spacer = createSpacer();
  assert.equal(nodeSchema.safeParse(spacer).success, true);
  assert.equal(spacer.type, "spacer");
  assert.deepEqual(spacer.props, { size: "m" });
  assert.equal("text" in spacer.props, false);
  assert.deepEqual(createSpacer("s").props, { size: "s" });
  assert.deepEqual(createSpacer("nope").props, { size: "m" });
  const paragraph = createParagraph();
  paragraph.props = { text: "Keep this" };
  const root = node("node_a10000000002", "section", { children: [paragraph, spacer] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const gap = site.pages[0].sections.find((section: { type: string }) => section.type === "spacer");
  const flow = site.pages[0].sections.find((section: { type: string }) => section.type === "flow");
  assert.equal(gap.size, "m");
  assert.equal(flow.blocks[0].text.text, "Keep this");
  const source = readFileSync(new URL("../../src/platform/elements/spacer.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
