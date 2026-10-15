import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { groupEnter } from "../../src/platform/drag/group-enter.ts";
import { reparent } from "../../src/platform/drag/reparent.ts";

const page = "node_a10000000001";
const section = "node_a10000000002";
const group = "grp_a10000000003";
const heading = "node_a10000000004";
const other = "node_a10000000005";
const box = { x: 10, y: 20, w: 30, h: 40 };
const parents = { allowedParents: ["section", "group", "stack"] };
const openParent = { acceptsChildren: true as const };

function document() {
  return {
    version: 1,
    pages: [
      {
        id: "page_aaaaaaaaaaaa",
        route: "/",
        root: {
          id: page,
          type: "page",
          children: [
            { id: section, type: "section", children: [{ id: heading, type: "heading", children: [] }] },
            { id: group, type: "group", box, children: [] },
            { id: other, type: "section", children: [{ id: "node_a10000000006", type: "text", children: [] }] },
          ],
        },
      },
    ],
  };
}

function ids(value: unknown, parentId: string): string[] {
  const root = (value as { pages: { root: { children: { id: string; children: { id: string }[]; box?: unknown }[] } }[] }).pages[0].root;
  return root.children.find((child) => child.id === parentId)?.children.map((child) => child.id) ?? [];
}

test("a heading drop makes the group its parent without copying the group", () => {
  const source = document();
  const next = groupEnter(source, {
    nodeId: heading,
    parentId: group,
    draggedLocked: false,
    childType: "heading",
    childParents: parents,
    parentType: "section",
    parentChildren: openParent,
  });
  assert.ok(next && next.ok);
  if (!next || !next.ok) return;
  assert.deepEqual(ids(next.document, group), [heading]);
  assert.deepEqual(ids(next.document, section), []);
  const root = (next.document as { pages: { root: { children: { id: string; box?: unknown }[] } }[] }).pages[0].root;
  const stored = root.children.find((child) => child.id === group);
  assert.deepEqual(stored?.box, box);
  assert.equal(root.children.filter((child) => child.id === group).length, 1);
  assert.equal(groupEnter(source, {
    nodeId: heading,
    parentId: section,
    draggedLocked: false,
    childType: "heading",
    childParents: parents,
    parentType: "section",
    parentChildren: openParent,
  }), null);
  const moved = reparent(source, {
    nodeId: heading,
    parentId: other,
    targetId: "node_a10000000006",
    after: false,
    draggedLocked: false,
    childType: "heading",
    childParents: parents,
    parentType: "section",
    parentChildren: openParent,
  });
  assert.ok(moved && moved.ok);
  if (!moved || !moved.ok) return;
  assert.deepEqual(ids(moved.document, other), [heading, "node_a10000000006"]);
  assert.deepEqual(ids(source, section), [heading]);
});

test("a group rejects a child it cannot hold", () => {
  const rejected = groupEnter(document(), {
    nodeId: heading,
    parentId: group,
    draggedLocked: false,
    childType: "heading",
    childParents: { allowedParents: ["form"] },
    parentType: "group",
    parentChildren: openParent,
  });
  assert.deepEqual(rejected, { ok: false, reason: "parent_rejected" });
  const sourceText = readFileSync(new URL("../../src/platform/drag/group-enter.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(sourceText.includes(word), false, word);
  }
});
