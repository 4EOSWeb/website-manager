import { test } from "node:test";
import assert from "node:assert/strict";
import { applyLayerReparent, decideLayerDrop } from "../../src/components/editor/layers/reparent-drop.ts";
import type { SiteDraft } from "../../src/lib/content-schema.ts";

const block = { id: "blk_a1000001", kind: "paragraph" as const, hidden: false, text: { text: "A paragraph", marks: [] } };

function site(): SiteDraft {
  return {
    pages: [
      {
        route: "/",
        locked: false,
        sections: [
          { id: "who", type: "flow", blocks: [block, { id: "blk_a1000002", kind: "paragraph", hidden: false, text: { text: "Stays", marks: [] } }] },
          { id: "solutions", type: "flow", blocks: [{ id: "blk_a1000003", kind: "heading", hidden: false, text: { text: "Next", marks: [] } }] },
          { id: "sec_map", type: "map", address: "1 Main" },
        ],
      },
    ],
  } as unknown as SiteDraft;
}

function visual() {
  return {
    version: 1,
    pages: [{
      route: "/",
      root: {
        id: "page",
        type: "page",
        children: [
          { id: "who", type: "section", children: [{ id: "blk_a1000001", type: "text", children: [] }, { id: "blk_a1000002", type: "text", children: [] }] },
          { id: "solutions", type: "section", children: [{ id: "blk_a1000003", type: "text", children: [] }] },
        ],
      },
    }],
  };
}

function ids(document: unknown, parentId: string): string[] {
  const root = (document as { pages: { root: { children: { id: string; children: { id: string }[] }[] } }[] }).pages[0].root;
  return root.children.find((child) => child.id === parentId)?.children.map((child) => child.id) ?? [];
}

test("a paragraph dropped on another section moves once", () => {
  const decision = decideLayerDrop({
    pageId: "page_home",
    sourceId: "blk_a1000001",
    sourceParentId: "who",
    targetId: "blk_a1000003",
    targetParentId: "solutions",
    targetSectionType: "flow",
    targetContainer: false,
    after: false,
  });
  assert.equal(decision.kind, "reparent");
  if (decision.kind !== "reparent") return;
  const applied = applyLayerReparent(site(), "/", visual(), decision);
  assert.ok(!("reason" in applied));
  if ("reason" in applied) return;
  const sections = applied.site.pages[0]?.sections ?? [];
  const who = sections[0];
  const solutions = sections[1];
  assert.deepEqual(who?.type === "flow" ? who.blocks.map((item) => item.id) : [], ["blk_a1000002"]);
  assert.deepEqual(solutions?.type === "flow" ? solutions.blocks.map((item) => item.id) : [], ["blk_a1000001", "blk_a1000003"]);
  assert.deepEqual(ids(applied.visual, "who"), ["blk_a1000002"]);
  assert.deepEqual(ids(applied.visual, "solutions"), ["blk_a1000001", "blk_a1000003"]);
  assert.equal(decideLayerDrop({
    pageId: "page_home",
    sourceId: "blk_a1000002",
    sourceParentId: "who",
    targetId: "blk_a1000001",
    targetParentId: "who",
    targetSectionType: "flow",
    targetContainer: false,
    after: true,
  }).kind, "reorder");
});

test("an illegal layer target does not move the node", () => {
  const ontoMap = decideLayerDrop({
    pageId: "page_home",
    sourceId: "blk_a1000001",
    sourceParentId: "who",
    targetId: "sec_map",
    targetParentId: "page_home",
    targetSectionType: "map",
    targetContainer: true,
    after: true,
  });
  assert.deepEqual(ontoMap, { kind: "reject", reason: "parent_rejected" });
  const ontoHeader = decideLayerDrop({
    pageId: "page_home",
    sourceId: "blk_a1000001",
    sourceParentId: "who",
    targetId: "header",
    targetParentId: "chrome",
    targetSectionType: "",
    targetContainer: false,
    after: true,
  });
  assert.deepEqual(ontoHeader, { kind: "reject", reason: "parent_rejected" });
  const before = site();
  const rejected = applyLayerReparent(before, "/", visual(), {
    kind: "reparent",
    fromSection: "who",
    toSection: "sec_map",
    blockId: "blk_a1000001",
    targetId: "",
    after: true,
  });
  assert.deepEqual(rejected, { reason: "parent_rejected" });
  const who = before.pages[0]?.sections[0];
  assert.deepEqual(who?.type === "flow" ? who.blocks.map((item) => item.id) : [], ["blk_a1000001", "blk_a1000002"]);
});
