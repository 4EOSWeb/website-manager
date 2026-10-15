import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pageCapabilityFlags } from "../../src/components/editor/inspector/page-controls.ts";
import { createPage } from "../../src/lib/editor-ops.ts";
import { defaultSiteDocument } from "../../src/lib/flow-seed.ts";
import { bodyNodes } from "../../src/platform/pages/regions.ts";

test("body nodes skip region chrome and a new page can edit its body", () => {
  const root = {
    children: [
      { id: "header", metadata: { region: "header" } },
      { id: "copy", metadata: {} },
      { id: "side", metadata: { region: "sidebar" } },
      { id: "ask", metadata: { region: "cta" } },
      { id: "end", metadata: { region: "footer" } },
    ],
  };
  assert.deepEqual(bodyNodes(root).map((node) => node.id), ["copy"]);
  const created = createPage(defaultSiteDocument(), {
    title: "Blank",
    route: "/blank-body",
    template: "blank",
    navVisible: false,
    seoTitle: "",
    metaDescription: "",
  });
  const page = created.site.pages.find((item) => item.route === "/blank-body");
  assert.equal(page?.editBody, true);
  assert.equal(pageCapabilityFlags({ level: 1, pageCapabilities: { editBody: false } }, page ?? {}).editBody, true);
  assert.equal(pageCapabilityFlags({ level: 2 }, { locked: true, editBody: true }).editBody, false);
  const source = readFileSync("src/platform/pages/regions.ts", "utf8").toLowerCase();
  assert.equal(source.includes("quantum"), false);
  assert.equal(source.includes("insights"), false);
  assert.equal(source.includes("plum"), false);
});
