import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { groupCanvas, type GroupNode } from "../../src/platform/canvas/group.ts";
import { canvasGroupId, ungroupCanvas } from "../../src/platform/canvas/ungroup.ts";

const canvas = {
  pages: [{
    root: {
      id: "node_a10000000001",
      type: "section",
      children: [
        { id: "node_a10000000002", type: "text", box: { x: 8, y: 8, w: 36, h: 28 } },
        { id: "node_a10000000003", type: "image", box: { x: 14, y: 14, w: 42, h: 28 } },
      ],
    },
  }],
};

function near(actual: { x: number; y: number; w: number; h: number } | undefined, expected: { x: number; y: number; w: number; h: number }) {
  assert.ok(actual);
  for (const key of ["x", "y", "w", "h"] as const) assert.ok(Math.abs(actual[key] - expected[key]) <= 1, key);
}

test("ungroup returns children to the parent and removes the group", () => {
  const grouped = groupCanvas(structuredClone(canvas), ["node_a10000000002", "node_a10000000003"]);
  assert.equal(grouped?.ok, true);
  if (!grouped || !grouped.ok) return;
  const released = ungroupCanvas(grouped.document, grouped.groupId);
  assert.equal(released?.ok, true);
  if (!released || !released.ok) return;
  const root = (released.document as { pages: { root: GroupNode }[] }).pages[0]?.root;
  assert.equal(root?.children?.some((child) => child.id === grouped.groupId), false);
  near(root?.children?.find((child) => child.id === "node_a10000000002")?.box, { x: 8, y: 8, w: 36, h: 28 });
  near(root?.children?.find((child) => child.id === "node_a10000000003")?.box, { x: 14, y: 14, w: 42, h: 28 });
  const again = groupCanvas(released.document, ["node_a10000000002", "node_a10000000003"]);
  assert.equal(again?.ok, true);
});

test("ungroup finds the group from a child and keeps a sibling still", () => {
  const grouped = groupCanvas(structuredClone(canvas), ["node_a10000000002", "node_a10000000003"]);
  assert.equal(grouped?.ok, true);
  if (!grouped || !grouped.ok) return;
  const withSibling = structuredClone(grouped.document) as { pages: { root: GroupNode }[] };
  withSibling.pages[0]?.root.children?.push({ id: "node_a10000000004", type: "button", box: { x: 70, y: 60, w: 12, h: 8 } });
  assert.equal(canvasGroupId(withSibling, "node_a10000000002"), grouped.groupId);
  assert.equal(canvasGroupId(withSibling, "node_a10000000004"), null);
  const released = ungroupCanvas(withSibling, canvasGroupId(withSibling, "node_a10000000002") ?? "");
  assert.equal(released?.ok, true);
  if (!released || !released.ok) return;
  const root = (released.document as { pages: { root: GroupNode }[] }).pages[0]?.root;
  assert.deepEqual(root?.children?.find((child) => child.id === "node_a10000000004")?.box, { x: 70, y: 60, w: 12, h: 8 });
  const bare = structuredClone(grouped.document) as { pages: { root: GroupNode }[] };
  const group = bare.pages[0]?.root.children?.find((child) => child.id === grouped.groupId);
  if (group) delete group.box;
  const plain = ungroupCanvas(bare, grouped.groupId);
  assert.equal(plain?.ok, true);
  if (!plain || !plain.ok) return;
  const plainRoot = (plain.document as { pages: { root: GroupNode }[] }).pages[0]?.root;
  assert.equal(plainRoot?.children?.some((child) => child.id === grouped.groupId), false);
  assert.equal(plainRoot?.children?.some((child) => child.id === "node_a10000000002"), true);
});

test("a missing group is not removed", () => {
  assert.equal(ungroupCanvas(canvas, "grp_000000000000") && (ungroupCanvas(canvas, "grp_000000000000") as { ok: boolean }).ok, false);
  assert.equal(ungroupCanvas(null, "grp_000000000000"), null);
  const source = readFileSync(new URL("../../src/platform/canvas/ungroup.ts", import.meta.url), "utf8");
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
  const script = readFileSync(new URL("../../overlays/quantum-age/src/components/site/canvas-script.ts", import.meta.url), "utf8");
  assert.equal(script.includes('"Ungroup", "ungroup"'), true);
  assert.equal(script.includes('"Group", "group"'), true);
});
