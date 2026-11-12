import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyRichMarks, createRichText, writeRichMarks } from "../../src/platform/elements/richtext.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { serializeQuantumAge } from "../../adapters/quantum-age/serialize.ts";
import { fakeContext } from "./platform-helpers.ts";
import type { RichMark } from "../../src/lib/rich-text.ts";

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
  return props && typeof props === "object" ? props as { text?: unknown; marks?: unknown } : {};
}

const bold: RichMark = { start: 0, end: 4, kind: "bold" };

test("a rich text node starts with an empty mark list", () => {
  const node = createRichText();
  assert.equal(nodeSchema.safeParse(node).success, true);
  assert.equal(node.type, "richtext");
  assert.equal(node.componentId, "generic.richtext");
  assert.equal(node.props.text, "Rich text");
  assert.deepEqual(node.props.marks, []);
  const source = readFileSync(new URL("../../src/platform/elements/richtext.ts", import.meta.url), "utf8");
  const lowered = source.toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(lowered.includes(word), false, word);
  }
  const catalog = readFileSync(new URL("../../src/components/editor/library.tsx", import.meta.url), "utf8");
  assert.match(catalog, /createRichText\(\)/);
  assert.match(source, /sanitizeMarks/);
});

test("bold on a rich text node stores a mark and leaves the other node alone", () => {
  const rich = createRichText();
  const other = node("node_cccccccccccc", "text", { props: { text: "Keep this sentence", marks: [] } });
  const marked = applyRichMarks(rich, "Rich text", [bold, { start: 4, end: 4, kind: "bold" }]);
  assert.deepEqual(marked.props.marks, [bold]);
  assert.equal(rich.props.text, "Rich text");
  assert.deepEqual(rich.props.marks, []);
  const root = node("node_aaaaaaaaaaaa", "section", { children: [other, rich] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const next = writeRichMarks(document, rich.id, "Rich text", [bold]) as typeof document;
  assert.deepEqual(readProps(next.pages[0]?.root.children[1]).marks, [bold]);
  assert.equal(readProps(next.pages[0]?.root.children[0]).text, "Keep this sentence");
  assert.deepEqual(readProps(next.pages[0]?.root.children[0]).marks, []);
  assert.equal(readProps(document.pages[0]?.root.children[0]).text, "Keep this sentence");
});

test("a rich text node serializes as a flow paragraph that keeps its marks", () => {
  const rich = applyRichMarks(createRichText(), "Rich text", [bold]);
  const other = node("node_a10000000004", "text", { componentId: "text", props: { text: "Keep this sentence", marks: [] } });
  const root = node("node_a10000000001", "section", { children: [other, rich] });
  const result = serializeQuantumAge(
    { version: 1, pages: [{ id: "page_a10000000001", route: "/", title: "Home", metadata: {}, root }] },
    fakeContext("web_quantum_age"),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const blocks = site.pages[0].sections[0].blocks;
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].kind, "paragraph");
  assert.equal(blocks[0].text.text, "Rich text");
  assert.deepEqual(blocks[0].text.marks, [bold]);
  assert.equal(readProps(other).text, "Keep this sentence");
});
