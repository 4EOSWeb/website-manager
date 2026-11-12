import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pageCapabilityFlags } from "../../src/components/editor/inspector/page-controls.ts";
import { createPage } from "../../src/lib/editor-ops.ts";
import { defaultSiteDocument } from "../../src/lib/flow-seed.ts";
import { findRegion, headerChromeField, staysLocked } from "../../src/platform/pages/regions.ts";

test("a page can edit its header only when that page allows it", () => {
  const root = { metadata: {}, children: [{ metadata: { region: "header" }, children: [{ metadata: { region: "cta" } }] }] };
  assert.equal(findRegion(root, "header")?.metadata?.region, "header");
  assert.equal(findRegion(root, "cta")?.metadata?.region, "cta");
  assert.equal(findRegion(root, "sidebar"), null);
  assert.equal(staysLocked({ locked: { locked: true } }), true);
  assert.equal(staysLocked({ locked: false }), false);
  assert.equal(headerChromeField("buttonLabel"), true);
  assert.equal(headerChromeField("copyright"), false);
  assert.equal(pageCapabilityFlags({ level: 2 }, { locked: false }).editHeader, false);
  const created = createPage(defaultSiteDocument(), {
    title: "Note",
    route: "/note",
    template: "article",
    navVisible: false,
    seoTitle: "",
    metaDescription: "",
  });
  const page = created.site.pages.find((item) => item.route === "/note");
  assert.equal(pageCapabilityFlags({ level: 2 }, page ?? {}).editHeader, true);
  const source = readFileSync("src/platform/pages/regions.ts", "utf8").toLowerCase();
  assert.equal(source.includes("quantum"), false);
  assert.equal(source.includes("plum"), false);
  assert.equal(source.includes("hero"), false);
  assert.equal(source.includes("insights"), false);
});
