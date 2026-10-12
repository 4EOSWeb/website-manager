import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { groupCanvas, type GroupNode } from "../../src/platform/canvas/group.ts";
import { ungroupCanvas } from "../../src/platform/canvas/ungroup.ts";

const canvas = {
  pages: [{
    root: {
      id: "node_a10000000001",
      type: "section",
      children: [
        { id: "node_a10000000002", type: "text", box: { x: 0, y: 0, w: 50, h: 40 } },
        { id: "node_a10000000003", type: "image", box: { x: 50, y: 0, w: 50, h: 40 } },
        { id: "node_a10000000004", type: "button", box: { x: 10, y: 70, w: 20, h: 10 } },
      ],
    },
  }],
};

test("selected nodes become children of the new group and undo restores the parent", () => {
  const grouped = groupCanvas(structuredClone(canvas), ["node_a10000000002", "node_a10000000003"]);
  assert.equal(grouped?.ok, true);
  if (!grouped || !grouped.ok) return;
  assert.equal(grouped.groupId.startsWith("grp_"), true);
  const root = (grouped.document as { pages: { root: GroupNode }[] }).pages[0]?.root;
  const group = root?.children?.find((child) => child.id === grouped.groupId);
  assert.equal(group?.type, "group");
  assert.deepEqual(group?.children?.map((child) => child.id), ["node_a10000000002", "node_a10000000003"]);
  assert.deepEqual(group?.box, { x: 0, y: 0, w: 100, h: 40 });
  assert.deepEqual(group?.children?.[0]?.box, { x: 0, y: 0, w: 50, h: 100 });
  assert.deepEqual(group?.children?.[1]?.box, { x: 50, y: 0, w: 50, h: 100 });
  const bystander = root?.children?.find((child) => child.id === "node_a10000000004");
  assert.deepEqual(bystander?.box, { x: 10, y: 70, w: 20, h: 10 });
  const restored = ungroupCanvas(grouped.document, grouped.groupId);
  assert.equal(restored?.ok, true);
  if (!restored || !restored.ok) return;
  const after = (restored.document as { pages: { root: GroupNode }[] }).pages[0]?.root;
  assert.equal(after?.children?.some((child) => child.id === grouped.groupId), false);
  assert.deepEqual(after?.children?.find((child) => child.id === "node_a10000000002")?.box, { x: 0, y: 0, w: 50, h: 40 });
  assert.deepEqual(after?.children?.find((child) => child.id === "node_a10000000003")?.box, { x: 50, y: 0, w: 50, h: 40 });
  assert.deepEqual(after?.children?.find((child) => child.id === "node_a10000000004")?.box, { x: 10, y: 70, w: 20, h: 10 });
});

test("a locked node and a single node are not grouped", () => {
  const locked = structuredClone(canvas) as { pages: { root: GroupNode }[] };
  const first = locked.pages[0]?.root.children?.[0];
  if (first) first.locked = true;
  assert.equal(groupCanvas(locked, ["node_a10000000002", "node_a10000000003"])?.ok, false);
  assert.equal(groupCanvas(canvas, ["node_a10000000002"])?.ok, false);
  assert.equal(groupCanvas(null, ["node_a10000000002", "node_a10000000003"]), null);
  const source = readFileSync(new URL("../../src/platform/canvas/group.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});
