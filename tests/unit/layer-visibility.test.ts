import { test } from "node:test";
import assert from "node:assert/strict";
import { setLayerVisibility } from "../../src/components/editor/layers/visibility-node.ts";

test("hiding a node sets visibility.hidden and keeps hideOn", () => {
  const document = {
    version: 1,
    pages: [{
      route: "/",
      root: {
        id: "root",
        children: [
          { id: "blk_p", type: "text", visibility: { hidden: false, hideOn: ["mobile"] }, children: [] },
          { id: "blk_h", type: "text", visibility: { hidden: false, hideOn: [] }, children: [] },
        ],
      },
    }],
  };
  const next = setLayerVisibility(document, "blk_p", true) as {
    pages: { root: { children: { id: string; visibility?: { hidden?: boolean; hideOn?: string[] } }[] } }[];
  };
  const children = next.pages[0]?.root.children ?? [];
  assert.equal(children.find((child) => child.id === "blk_p")?.visibility?.hidden, true);
  assert.deepEqual(children.find((child) => child.id === "blk_p")?.visibility?.hideOn, ["mobile"]);
  assert.equal(children.find((child) => child.id === "blk_h")?.visibility?.hidden, false);
  const source = document.pages[0]?.root.children[0];
  assert.equal(source?.visibility?.hidden, false);
});
