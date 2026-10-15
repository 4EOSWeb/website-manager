import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { libraryDrop } from "../../src/platform/drag/library-drop.ts";

const canvas = "node_a10000000001";

function document() {
  return {
    version: 1,
    pages: [
      {
        id: "page_aaaaaaaaaaaa",
        route: "/",
        root: {
          id: "node_a10000000002",
          type: "page",
          children: [{ id: canvas, type: "section", children: [] }],
        },
      },
    ],
  };
}

function children(value: unknown) {
  const root = (value as { pages: { root: { children: { id: string; children: { type?: string; box?: { x: number; y: number } }[] }[] } }[] }).pages[0].root;
  return root.children[0].children;
}

test("a library button dropped on a canvas creates one button at that box", () => {
  const source = document();
  const next = libraryDrop(source, {
    factoryId: "element:button",
    parentId: canvas,
    parentType: "section",
    parentLocked: false,
    box: { x: 32, y: 40, w: 42, h: 28 },
  });
  assert.equal(next.ok, true);
  if (!next.ok || !next.document) return;
  const stored = children(next.document);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].type, "button");
  assert.deepEqual(stored[0].box, { x: 32, y: 40, w: 42, h: 28 });
  assert.equal(children(source).length, 0);
  const image = libraryDrop(source, { factoryId: "element:image", parentId: canvas, parentType: "section", parentLocked: false });
  assert.equal(image.ok, true);
  if (!image.ok || !image.document) return;
  assert.equal(children(image.document)[0].type, "image");
});

test("an invalid library drop creates zero nodes", () => {
  const source = document();
  const rejected = libraryDrop(source, { factoryId: "element:input", parentId: canvas, parentType: "section", parentLocked: false });
  assert.deepEqual(rejected, { ok: false, reason: "parent_rejected" });
  const locked = libraryDrop(source, { factoryId: "element:button", parentId: canvas, parentType: "section", parentLocked: true });
  assert.deepEqual(locked, { ok: false, reason: "locked" });
  const missing = libraryDrop(source, { factoryId: "element:missing", parentId: canvas, parentType: "section", parentLocked: false });
  assert.deepEqual(missing, { ok: false, reason: "parent_rejected" });
  assert.equal(children(source).length, 0);
  const sourceText = readFileSync(new URL("../../src/platform/drag/library-drop.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(sourceText.includes(word), false, word);
  }
});
