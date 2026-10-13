import { test } from "node:test";
import assert from "node:assert/strict";
import { lockFlowBlock, lockVisualNode } from "../../src/components/editor/layers/lock-node.ts";
import type { SiteDraft } from "../../src/lib/content-schema.ts";

test("locking a paragraph sets the flag and leaves the text", () => {
  const site = {
    pages: [{
      route: "/",
      sections: [{
        id: "who",
        type: "flow",
        blocks: [{ id: "blk_p", kind: "paragraph", hidden: false, locked: false, text: { text: "Keep this", marks: [] } }],
      }],
    }],
  } as unknown as SiteDraft;
  const next = lockFlowBlock(site, "/", "who", "blk_p");
  const block = next.pages[0]?.sections[0];
  const locked = block?.type === "flow" ? block.blocks[0] : undefined;
  assert.equal(locked?.locked, true);
  assert.equal(locked && "text" in locked ? locked.text?.text : "", "Keep this");
  assert.equal(site.pages[0]?.sections[0]?.type === "flow" ? site.pages[0].sections[0].blocks[0]?.locked : true, false);
  const document = { version: 1, pages: [{ route: "/", root: { id: "root", children: [{ id: "blk_p", type: "text", props: { text: "Keep this" }, children: [] }] } }] };
  const visual = lockVisualNode(document, "blk_p") as { pages: { root: { children: { locked?: { locked?: boolean }; props?: { text?: string } }[] } }[] };
  assert.equal(visual.pages[0]?.root.children[0]?.locked?.locked, true);
  assert.equal(visual.pages[0]?.root.children[0]?.props?.text, "Keep this");
  assert.equal(lockVisualNode(document, "missing"), null);
});
