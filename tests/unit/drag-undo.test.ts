import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emptyHistory, redoScoped, trailDrop, trailText, undoScoped, type ScopedSnapshot } from "../../src/lib/history.ts";
import { nodeSlot, reparent } from "../../src/platform/drag/reparent.ts";

const sourceSection = "node_a10000000002";
const destination = "node_a10000000003";
const paragraph = "node_a10000000004";
const site = "site_example";

function document() {
  return {
    version: 1,
    label: "Original",
    pages: [
      {
        id: "page_aaaaaaaaaaaa",
        route: "/",
        root: {
          id: "node_a10000000001",
          type: "page",
          children: [
            {
              id: sourceSection,
              type: "section",
              children: [
                { id: paragraph, type: "text", children: [] },
                { id: "node_a10000000005", type: "text", children: [] },
              ],
            },
            { id: destination, type: "section", children: [{ id: "node_a10000000006", type: "text", children: [] }] },
          ],
        },
      },
    ],
  };
}

const input = {
  nodeId: paragraph,
  parentId: destination,
  targetId: "node_a10000000006",
  after: false,
  draggedLocked: false,
  childType: "text",
  childParents: { allowedParents: ["section", "container", "stack"] },
  parentType: "section",
  parentChildren: { acceptsChildren: true as const },
};

test("one undo reverses a reparent and redo puts the node back", () => {
  const before = document();
  const typed = { ...before, label: "Edited" };
  const text = trailText({ history: emptyHistory<ScopedSnapshot<ReturnType<typeof document>>>(), textKey: "" }, site, before, "section:paragraph:text");
  const again = trailText(text, site, typed, "section:paragraph:text");
  assert.equal(again.history.past.length, 1);
  const moved = reparent(typed, input);
  assert.ok(moved && moved.ok);
  if (!moved || !moved.ok) return;
  const dropped = trailDrop(again, site, typed);
  assert.equal(dropped.textKey, "");
  assert.equal(dropped.history.past.length, 2);
  const undone = undoScoped(dropped.history, site, moved.document);
  assert.ok(undone);
  if (!undone) return;
  assert.equal((undone.value as { label: string }).label, "Edited");
  assert.deepEqual(nodeSlot(undone.value, paragraph), { parentId: sourceSection, index: 0 });
  const redone = redoScoped(undone.history, site, undone.value);
  assert.ok(redone);
  if (!redone) return;
  assert.equal((redone.value as { label: string }).label, "Edited");
  assert.deepEqual(nodeSlot(redone.value, paragraph), { parentId: destination, index: 0 });
  const source = readFileSync(new URL("../../src/platform/drag/reparent.ts", import.meta.url), "utf8").toLowerCase();
  const history = readFileSync(new URL("../../src/lib/history.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
    assert.equal(history.includes(word), false, word);
  }
});
