import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGroup } from "../../src/platform/elements/group.ts";
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

test("a group id uses grp and stays empty", () => {
  const group = createGroup();
  assert.equal(nodeSchema.safeParse(group).success, true);
  assert.match(group.id, /^grp_[0-9a-f]{12}$/);
  assert.equal(group.type, "group");
  assert.deepEqual(group.children, []);
  assert.deepEqual(group.layout, { mode: "flow", direction: "vertical", gap: 0 });
  const paragraph = createParagraph();
  const root = node("node_a10000000002", "section", { children: [paragraph, group] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const grouped = site.pages[0].sections.find((section: { editorName?: string }) => section.editorName === "Group");
  const flow = site.pages[0].sections.find((section: { editorName?: string; type: string }) => section.type === "flow" && section.editorName !== "Group");
  assert.deepEqual(grouped.blocks, []);
  assert.equal(flow.blocks[0].text.text, "Paragraph");
  assert.equal(root.children[0]?.id, paragraph.id);
  const source = readFileSync(new URL("../../src/platform/elements/group.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
