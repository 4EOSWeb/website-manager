import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { layerRows, visualPageRoot, type LayerNode } from "../../src/components/editor/layers/rows.ts";

const managed: LayerNode = {
  id: "node_managed",
  type: "custom",
  locked: { locked: true },
  source: { providerManaged: true },
  metadata: { name: "Provider block" },
  children: [],
};

const root: LayerNode = {
  id: "node_root",
  type: "section",
  children: [
    { id: "node_heading", type: "heading", metadata: {}, children: [] },
    managed,
  ],
};

test("every node has a row, including a provider-managed node", () => {
  const rows = layerRows(root);
  assert.deepEqual(rows.map((row) => row.id), ["node_root", "node_heading", "node_managed"]);
  assert.equal(rows[1]?.label, "heading");
  assert.equal(rows[2]?.label, "Provider block");
  assert.equal(rows[2]?.locked, true);
  assert.equal(rows[2]?.providerManaged, true);
  assert.equal(rows[2]?.parentId, "node_root");
  assert.equal(rows[2]?.depth, 1);
});

test("a missing visual document keeps the version 3 list", () => {
  assert.equal(visualPageRoot(null, "/"), null);
  assert.equal(visualPageRoot({ pages: [{ route: "/about", root }] }, "/"), null);
  assert.equal(visualPageRoot({ pages: [{ route: "/", root }] }, "/")?.id, "node_root");
  const panel = readFileSync(new URL("../../src/components/editor/panels.tsx", import.meta.url), "utf8");
  assert.equal(panel.includes('data-layer-source="visual"'), true);
  assert.equal(panel.includes('data-layer-source="version3"'), true);
  assert.equal(panel.includes("section.blocks.map"), true);
  const note = readFileSync(new URL("../../docs/migration/compatibility-window.md", import.meta.url), "utf8");
  assert.equal(note.includes("Version 3 layers list"), true);
  assert.equal(note.includes("Step 19.25"), true);
});
