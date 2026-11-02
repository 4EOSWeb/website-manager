import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { reparent } from "../../src/platform/drag/reparent.ts";
import { flowReorder } from "../../src/platform/drag/flow-insert.ts";
import { moveBlockToSection } from "../../src/lib/editor-ops.ts";
import type { SiteDraft } from "../../src/lib/content-schema.ts";

const sourceSection = "node_a10000000002";
const destination = "node_a10000000003";
const paragraph = "node_a10000000004";
const sibling = "node_a10000000005";
const heading = "node_a10000000006";
const parents = { allowedParents: ["section", "container", "stack"] };
const openParent = { acceptsChildren: true as const };

function document() {
  return {
    version: 1,
    pages: [
      {
        id: "page_aaaaaaaaaaaa",
        route: "/",
        root: {
          id: "node_a10000000001",
          type: "page",
          children: [
            { id: sourceSection, type: "section", children: [{ id: paragraph, type: "text", children: [] }, { id: sibling, type: "text", children: [] }] },
            { id: destination, type: "section", children: [{ id: heading, type: "text", children: [] }] },
          ],
        },
      },
    ],
  };
}

function childIds(value: unknown, parentId: string): string[] {
  const root = (value as { pages: { root: { children: { id: string; children: { id: string }[] }[] } }[] }).pages[0].root;
  return root.children.find((child) => child.id === parentId)?.children.map((child) => child.id) ?? [];
}

const input = {
  nodeId: paragraph,
  parentId: destination,
  targetId: heading,
  after: false,
  draggedLocked: false,
  childType: "text",
  childParents: parents,
  parentType: "section",
  parentChildren: openParent,
};

test("a node moves to the new parent and leaves the old one", () => {
  const source = document();
  const next = reparent(source, input);
  assert.ok(next && next.ok);
  if (!next || !next.ok) return;
  assert.deepEqual(childIds(next.document, sourceSection), [sibling]);
  assert.deepEqual(childIds(next.document, destination), [paragraph, heading]);
  assert.deepEqual(childIds(source, sourceSection), [paragraph, sibling]);
  assert.deepEqual(childIds(source, destination), [heading]);
  const same = reparent(source, { ...input, parentId: sourceSection, targetId: sibling, after: true });
  assert.equal(same, null);
  const flowed = flowReorder(source, paragraph, sibling, true);
  assert.ok(flowed);
  assert.deepEqual(childIds(flowed, sourceSection), [sibling, paragraph]);
});

test("a locked or incompatible node stays in place", () => {
  const source = document();
  const locked = reparent(source, { ...input, draggedLocked: true });
  assert.deepEqual(locked, { ok: false, reason: "locked" });
  assert.deepEqual(childIds(source, sourceSection), [paragraph, sibling]);
  const rejected = reparent(source, { ...input, parentType: "text", parentChildren: { acceptsChildren: false } });
  assert.deepEqual(rejected, { ok: false, reason: "parent_rejected" });
  const intoSelf = reparent(source, { ...input, nodeId: sourceSection, parentId: paragraph, childType: "section" });
  assert.deepEqual(intoSelf, { ok: false, reason: "parent_rejected" });
  const sourceText = readFileSync(new URL("../../src/platform/drag/reparent.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(sourceText.includes(word), false, word);
  }
});

test("one section move removes the block from the source", () => {
  const block = { id: "blk_a1000001", kind: "paragraph" as const, hidden: false, text: { text: "A paragraph", marks: [] } };
  const site = {
    pages: [
      {
        route: "/",
        locked: false,
        sections: [
          { id: "who", type: "flow", blocks: [block, { id: "blk_a1000002", kind: "paragraph", hidden: false, text: { text: "Stays", marks: [] } }] },
          { id: "solutions", type: "flow", blocks: [{ id: "blk_a1000003", kind: "heading", hidden: false, text: { text: "Next", marks: [] } }] },
        ],
      },
    ],
  } as unknown as SiteDraft;
  const next = moveBlockToSection(site, "/", "who", "solutions", "blk_a1000001", "blk_a1000003", false);
  const pages = next.pages[0].sections;
  const sourceBlocks = pages[0].type === "flow" ? pages[0].blocks.map((item) => item.id) : [];
  const destinationBlocks = pages[1].type === "flow" ? pages[1].blocks.map((item) => item.id) : [];
  assert.deepEqual(sourceBlocks, ["blk_a1000002"]);
  assert.deepEqual(destinationBlocks, ["blk_a1000001", "blk_a1000003"]);
  assert.equal(moveBlockToSection(site, "/", "who", "who", "blk_a1000001", "blk_a1000002", true), site);
});
