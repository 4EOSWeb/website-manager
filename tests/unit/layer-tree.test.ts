import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { defaultOpenIds, layerRowSelected, layerRows, layerStorageKey, legacyTarget, visualPageRoot, type LayerNode } from "../../src/components/editor/layers/rows.ts";

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
  assert.equal(rows[1]?.label, "Heading");
  assert.equal(rows[2]?.label, "Provider block");
  assert.equal(rows[2]?.locked, true);
  assert.equal(rows[2]?.providerManaged, true);
  assert.equal(rows[2]?.parentId, "node_root");
  assert.equal(rows[2]?.depth, 1);
});

test("the root and the next level start open", () => {
  const deep: LayerNode = {
    id: "node_root",
    type: "section",
    children: [{
      id: "node_child",
      type: "section",
      children: [{ id: "node_deep", type: "text", children: [{ id: "node_leaf", type: "text", children: [] }] }],
    }],
  };
  assert.deepEqual(defaultOpenIds(deep), ["node_root", "node_child"]);
  assert.equal(layerStorageKey("web_example", "page_home"), "4eos-layers:web_example:page_home");
});

test("a layer click resolves the section and block, and the matching row is selected", () => {
  assert.equal(legacyTarget("page/0/page_1"), null);
  assert.deepEqual(legacyTarget("page/0/page_1/section/2/main"), { sectionId: "main", itemId: "" });
  assert.deepEqual(legacyTarget("page/0/page_1/section/2/main/block/1/item_a"), { sectionId: "main", itemId: "item_a" });
  const section: LayerNode = { id: "node_section", type: "section", metadata: { legacyId: "page/0/page_1/section/2/main" }, children: [] };
  const block: LayerNode = { id: "node_block", type: "heading", metadata: { legacyId: "page/0/page_1/section/2/main/block/1/item_a" }, children: [] };
  assert.equal(layerRowSelected(section, { sectionId: "main", itemId: "" }), true);
  assert.equal(layerRowSelected(block, { sectionId: "main", itemId: "" }), false);
  assert.equal(layerRowSelected(block, { sectionId: "main", itemId: "item_a" }), true);
  assert.equal(layerRowSelected(section, { sectionId: "main", itemId: "item_a" }), false);
  const tree = readFileSync(new URL("../../src/components/editor/layers/tree.tsx", import.meta.url), "utf8");
  assert.equal(tree.includes("aria-selected={selected}"), true);
  assert.equal(tree.includes("onSelect(node)"), true);
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
