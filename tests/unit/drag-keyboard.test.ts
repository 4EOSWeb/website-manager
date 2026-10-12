import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { keyboardMove } from "../../src/platform/drag/keyboard.ts";

const section = "node_a10000000002";
const paragraph = "node_a10000000003";
const heading = "node_a10000000004";
const next = "node_a10000000005";

function document() {
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
            {
              id: section,
              type: "section",
              name: "Section",
              children: [
                { id: paragraph, type: "text", name: "Paragraph", children: [] },
                { id: heading, type: "text", name: "Heading", children: [] },
              ],
            },
            { id: next, type: "section", name: "Next", children: [] },
          ],
        },
      },
    ],
  };
}

const parents = { allowedParents: ["section", "container", "stack", "grid", "group", "card"] };

function ids(value: unknown, parentId: string): string[] {
  const root = (value as { pages: { root: { children: { id: string; children: { id: string }[] }[] } }[] }).pages[0].root;
  return root.children.find((child) => child.id === parentId)?.children.map((child) => child.id) ?? [];
}

test("alt plus down moves a flow node below the next one", () => {
  const source = document();
  const moved = keyboardMove(source, { nodeId: paragraph, key: "ArrowDown", alt: true, shift: false, childType: "text", childParents: parents });
  assert.ok(moved && moved.ok);
  if (!moved || !moved.ok) return;
  assert.equal(moved.announcement, "Moved below Heading");
  assert.deepEqual(ids(moved.document, section), [heading, paragraph]);
  assert.deepEqual(ids(source, section), [paragraph, heading]);
  const blocked = keyboardMove(source, { nodeId: heading, key: "ArrowDown", alt: true, shift: false, childType: "text", childParents: parents });
  assert.deepEqual(blocked, { ok: false, announcement: "This item cannot go there.", reason: "parent_rejected" });
  assert.equal(keyboardMove(source, { nodeId: paragraph, key: "ArrowDown", alt: false, shift: false, childType: "text", childParents: parents }), null);
  const row = document();
  const root = row.pages[0].root.children[0] as { layout?: { direction: string } };
  root.layout = { direction: "row" };
  const across = keyboardMove(row, { nodeId: paragraph, key: "ArrowRight", alt: true, shift: false, childType: "text", childParents: parents });
  assert.ok(across && across.ok);
  if (!across || !across.ok) return;
  assert.equal(across.announcement, "Moved below Heading");
});

test("alt plus shift moves into the next container and a locked node stays", () => {
  const source = document();
  const entered = keyboardMove(source, { nodeId: paragraph, key: "ArrowDown", alt: true, shift: true, childType: "text", childParents: parents });
  assert.ok(entered && entered.ok);
  if (!entered || !entered.ok) return;
  assert.equal(entered.announcement, "Moved below Next");
  assert.deepEqual(ids(entered.document, section), [heading]);
  assert.deepEqual(ids(entered.document, next), [paragraph]);
  const locked = document();
  (locked.pages[0].root.children[0].children[0] as { locked?: { locked: boolean } }).locked = { locked: true };
  const rejected = keyboardMove(locked, { nodeId: paragraph, key: "ArrowDown", alt: true, shift: false, childType: "text", childParents: parents });
  assert.deepEqual(rejected, { ok: false, announcement: "This item is locked.", reason: "locked" });
  assert.deepEqual(ids(locked, section), [paragraph, heading]);
  const sourceText = readFileSync(new URL("../../src/platform/drag/keyboard.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(sourceText.includes(word), false, word);
  }
});
