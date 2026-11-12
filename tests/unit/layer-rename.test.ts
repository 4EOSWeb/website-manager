import { test } from "node:test";
import assert from "node:assert/strict";
import { renameVisualNode, withLayerName } from "../../src/components/editor/layers/rename-name.ts";

test("a layer name does not change the heading text", () => {
  const node: { id: string; metadata: Record<string, unknown>; props: { text: string }; children: [] } = {
    id: "node_h",
    metadata: {},
    props: { text: "Keep this heading" },
    children: [],
  };
  const named = withLayerName(node, " Intro ");
  assert.equal(named.metadata?.name, "Intro");
  assert.equal((named.props as { text?: string } | undefined)?.text, "Keep this heading");
  assert.equal(node.props.text, "Keep this heading");
  const cleared = withLayerName(named, "  ");
  assert.equal("name" in (cleared.metadata ?? {}), false);
  assert.equal((cleared.props as { text?: string } | undefined)?.text, "Keep this heading");
  const document = { version: 1, pages: [{ route: "/", root: { id: "node_root", children: [node] } }] };
  const next = renameVisualNode(document, "node_h", "Intro") as {
    pages: { root: { children: { metadata?: { name?: string }; props?: { text?: string } }[] } }[];
  };
  assert.equal(next.pages[0]?.root.children[0]?.metadata?.name, "Intro");
  assert.equal(next.pages[0]?.root.children[0]?.props?.text, "Keep this heading");
  assert.equal(node.props.text, "Keep this heading");
  assert.equal(renameVisualNode(document, "missing", "Intro"), null);
});
