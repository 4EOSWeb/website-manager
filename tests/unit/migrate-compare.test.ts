import assert from "node:assert/strict";
import { test } from "node:test";
import { compareMigration, legacyLocks } from "../../src/platform/migrate/compare.ts";

test("comparison fails when a text string is missing and passes when it was copied", () => {
  const source = {
    pages: [
      {
        id: "page_home",
        route: "/",
        title: "Home",
        seoTitle: "Home",
        metaDescription: "A page",
        locked: true,
        sections: [
          {
            id: "hero",
            locked: false,
            blocks: [{ id: "h", kind: "heading", locked: true, text: { text: "Hello there", marks: [] } }],
          },
        ],
      },
    ],
  };
  const locks = legacyLocks(source);
  const dropped = compareMigration(source, { version: 1, pages: [{ route: "/", title: "Home", metadata: { seoTitle: "Home", metaDescription: "A page" }, root: { metadata: { legacyId: "page/0/page_home" }, locked: { locked: true }, children: [] } }] }, locks);
  assert.equal(dropped.ok, false);
  assert.equal(dropped.missing.some((item) => item.kind === "text" && item.path.endsWith("/text")), true);
  assert.equal(JSON.stringify(dropped).includes("Hello there"), false);

  const copied = compareMigration(source, {
    version: 1,
    pages: [{
      route: "/",
      title: "Home",
      metadata: { seoTitle: "Home", metaDescription: "A page" },
      root: {
        metadata: { legacyId: "page/0/page_home" },
        locked: { locked: true },
        children: [{
          metadata: { legacyId: "page/0/page_home/section/0/hero" },
          locked: { locked: false },
          children: [{
            metadata: { legacyId: "page/0/page_home/section/0/hero/block/0/h" },
            locked: { locked: true },
            props: { text: "Hello there" },
          }],
        }],
      },
    }],
  }, locks);
  assert.equal(copied.ok, true);
});
