import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { groupExit } from "../../src/platform/drag/group-exit.ts";
import { reparent } from "../../src/platform/drag/reparent.ts";

const section = "node_a10000000002";
const group = "grp_a10000000003";
const heading = "node_a10000000004";
const parents = { allowedParents: ["section", "group", "stack"] };
const openParent = { acceptsChildren: true as const };

function document(locked = false) {
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
            { id: section, type: "section", children: [{ id: "node_a10000000006", type: "text", children: [] }] },
            { id: group, type: "group", children: [{ id: heading, type: "heading", locked: { locked }, children: [] }] },
          ],
        },
      },
    ],
  };
}

function ids(value: unknown, parentId: string): string[] {
  const root = (value as { pages: { root: { children: { id: string; children: { id: string }[] }[] } }[] }).pages[0].root;
  return root.children.find((child) => child.id === parentId)?.children.map((child) => child.id) ?? [];
}

const input = {
  nodeId: heading,
  parentId: section,
  targetId: "node_a10000000006",
  after: true,
  draggedLocked: false,
  childType: "heading",
  childParents: parents,
  parentType: "section",
  parentChildren: openParent,
};

test("a child leaves the group and the empty group remains", () => {
  const source = document();
  const next = groupExit(source, input);
  assert.ok(next && next.ok);
  if (!next || !next.ok) return;
  assert.deepEqual(ids(next.document, group), []);
  assert.deepEqual(ids(next.document, section), ["node_a10000000006", heading]);
  const root = (next.document as { pages: { root: { children: { id: string; type: string }[] } }[] }).pages[0].root;
  assert.equal(root.children.filter((child) => child.id === group && child.type === "group").length, 1);
  assert.deepEqual(ids(source, group), [heading]);
  assert.equal(groupExit(source, { ...input, nodeId: "node_a10000000006", parentId: group }), null);
  const moved = reparent(source, { ...input, nodeId: "node_a10000000006", parentId: group, targetId: heading, after: false });
  assert.ok(moved && moved.ok);
});

test("a locked group child stays", () => {
  const source = document(true);
  assert.deepEqual(groupExit(source, input), { ok: false, reason: "locked" });
  assert.deepEqual(ids(source, group), [heading]);
  const sourceText = readFileSync(new URL("../../src/platform/drag/group-exit.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(sourceText.includes(word), false, word);
  }
});
