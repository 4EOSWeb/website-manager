import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createParagraph } from "../../src/platform/elements/paragraph.ts";
import { insertAfter, nodeIdsIn } from "../../src/platform/elements/create.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { serializeQuantumAge } from "../../adapters/quantum-age/serialize.ts";
import { emptyHistory, rememberScoped, undoScoped, type ScopedSnapshot } from "../../src/lib/history.ts";
import { insertFlowBlock } from "../../src/lib/editor-ops.ts";
import type { SiteDraft } from "../../src/lib/content-schema.ts";
import { fakeContext } from "./platform-helpers.ts";

function readText(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const props = (value as { props?: { text?: unknown } }).props;
  return typeof props?.text === "string" ? props.text : "";
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

test("a paragraph node is new and its text is Paragraph", () => {
  const first = createParagraph();
  const second = createParagraph();
  assert.equal(nodeSchema.safeParse(first).success, true);
  assert.equal(first.type, "text");
  assert.equal(first.componentId, "generic.text");
  assert.equal(first.props.text, "Paragraph");
  assert.notEqual(first.id, second.id);
  assert.match(first.id, /^node_[0-9a-f]{12}$/);
  const source = readFileSync(new URL("../../src/platform/elements/paragraph.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
  const catalog = readFileSync(new URL("../../src/components/editor/library.tsx", import.meta.url), "utf8");
  assert.match(catalog, /createParagraph\(\)/);
  assert.match(catalog, /id: "element:paragraph"/);
});

test("a paragraph is inserted after the selection and does not change nearby text", () => {
  const existing = node("node_cccccccccccc", "text", { componentId: "text", props: { text: "Keep this sentence" } });
  const heading = node("node_bbbbbbbbbbbb", "heading", { props: { text: "Keep this title" } });
  const root = node("node_aaaaaaaaaaaa", "section", { children: [existing, heading] });
  const document = {
    version: 1,
    pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }],
  };
  const added = createParagraph();
  const next = insertAfter(document, "/", existing.id, added) as typeof document;
  const ids = next.pages[0]?.root.children.map((child) => child.id);
  assert.deepEqual(ids, [existing.id, added.id, heading.id]);
  assert.equal(readText(next.pages[0]?.root.children[0]), "Keep this sentence");
  assert.equal(readText(next.pages[0]?.root.children[1]), "Paragraph");
  assert.equal(readText(next.pages[0]?.root.children[0]).includes("Paragraph"), false);
  assert.equal(document.pages[0]?.root.children.length, 2);

  const atEnd = createParagraph();
  const rooted = insertAfter(document, "/", null, atEnd) as typeof document;
  assert.equal(rooted.pages[0]?.root.children.at(-1)?.id, atEnd.id);
});

test("undo removes only the new paragraph", () => {
  const existing = node("node_cccccccccccc", "text", { props: { text: "Keep this sentence" } });
  const root = node("node_aaaaaaaaaaaa", "section", { children: [existing] });
  const before = {
    version: 1,
    pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }],
  };
  const added = createParagraph();
  const after = insertAfter(structuredClone(before), "/", existing.id, added);
  const history = rememberScoped(emptyHistory<ScopedSnapshot<typeof before>>(), "web_quantum_age", before, before);
  const undone = undoScoped(history, "web_quantum_age", after, after);
  assert.ok(undone);
  assert.equal(nodeIdsIn(after).includes(added.id), true);
  assert.equal(nodeIdsIn(undone.visualDocument).includes(added.id), false);
  const restored = undone.visualDocument as typeof before;
  assert.equal(readText(restored.pages[0]?.root.children[0]), "Keep this sentence");
  assert.equal(restored.pages[0]?.root.children.length, 1);
});

test("a paragraph serializes as its own flow block", () => {
  const existing = node("node_a10000000004", "text", { componentId: "text", props: { text: "Keep this sentence" } });
  const paragraph = createParagraph();
  const root = node("node_a10000000001", "section", { children: [existing, paragraph] });
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
  assert.equal(blocks[0].text.text, "Paragraph");
  assert.equal(blocks[0].id, paragraph.id);
  assert.equal(readText(existing), "Keep this sentence");
  assert.equal(String(blocks[0].text.text).includes("Keep this sentence"), false);
});

test("a preview paragraph is a new block after the selected one", () => {
  const site = {
    version: 3,
    pages: [
      {
        id: "page_home",
        route: "/",
        title: "Home",
        locked: false,
        sections: [
          {
            id: "sec_flow",
            type: "flow",
            hidden: false,
            blocks: [{ id: "blk_who_p", kind: "paragraph", hidden: false, text: { text: "Keep this sentence", marks: [] } }],
          },
        ],
      },
    ],
  } as unknown as SiteDraft;
  const next = insertFlowBlock(site, "/", "sec_flow", { id: "blk_added", kind: "paragraph", hidden: false, text: { text: "Paragraph", marks: [] } }, "blk_who_p");
  const flow = next.pages[0]?.sections[0];
  assert.equal(flow?.type, "flow");
  if (flow?.type !== "flow") return;
  assert.equal(flow.blocks[0]?.text && "text" in flow.blocks[0].text ? flow.blocks[0].text.text : "", "Keep this sentence");
  assert.equal(flow.blocks[1]?.text && "text" in flow.blocks[1].text ? flow.blocks[1].text.text : "", "Paragraph");
  assert.equal(site.pages[0]?.sections[0]?.type === "flow" ? site.pages[0].sections[0].blocks.length : 0, 1);
});
