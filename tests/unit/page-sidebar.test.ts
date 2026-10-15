import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pageCapabilityFlags } from "../../src/components/editor/inspector/page-controls.ts";
import { validateDocument } from "../../src/platform/document/document.ts";
import { bodyNodes, findRegion } from "../../src/platform/pages/regions.ts";
import { articlePage } from "../../src/platform/templates/article.ts";
import { createPage } from "../../src/lib/editor-ops.ts";
import { defaultSiteDocument } from "../../src/lib/flow-seed.ts";

test("a sidebar can be edited only when the page has one and allows it", () => {
  const document = articlePage();
  assert.equal(validateDocument(document).ok, true);
  const page = document.pages[0];
  assert.ok(page);
  assert.equal(findRegion(page.root, "sidebar")?.metadata?.region, "sidebar");
  assert.equal(bodyNodes(page.root).some((node) => node.metadata?.region === "sidebar"), false);
  const article = createPage(defaultSiteDocument(), {
    title: "Note",
    route: "/column",
    template: "article",
    navVisible: false,
    seoTitle: "",
    metaDescription: "",
  }).site.pages.find((page) => page.route === "/column");
  const blank = createPage(defaultSiteDocument(), {
    title: "Plain",
    route: "/plain",
    template: "blank",
    navVisible: false,
    seoTitle: "",
    metaDescription: "",
  }).site.pages.find((page) => page.route === "/plain");
  assert.equal(article?.sections.some((section) => section.editorName === "Sidebar"), true);
  assert.equal(blank?.sections.some((section) => section.editorName === "Sidebar"), false);
  assert.equal(pageCapabilityFlags({ level: 2 }, article ?? {}).editSidebar, true);
  assert.equal(pageCapabilityFlags({ level: 2 }, blank ?? {}).editSidebar, false);
  const source = readFileSync("src/platform/templates/article.ts", "utf8").toLowerCase();
  assert.equal(source.includes("quantum"), false);
  assert.equal(source.includes("insights"), false);
  assert.equal(source.includes("plum"), false);
  assert.equal(source.includes("hero"), false);
});
