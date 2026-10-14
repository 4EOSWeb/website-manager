import { test } from "node:test";
import assert from "node:assert/strict";
import { pageCapabilityFlags } from "../../src/components/editor/inspector/page-controls.ts";
import { createPage } from "../../src/lib/editor-ops.ts";
import { defaultSiteDocument } from "../../src/lib/flow-seed.ts";
import { validateDocument } from "../../src/platform/document/document.ts";
import { findRegion } from "../../src/platform/pages/regions.ts";
import { landingPage } from "../../src/platform/templates/landing.ts";

test("a landing call to action is editable only when the page allows it", () => {
  const document = landingPage();
  assert.equal(validateDocument(document).ok, true);
  assert.equal(findRegion(document.pages[0]?.root, "cta")?.metadata.region, "cta");
  const landing = createPage(defaultSiteDocument(), {
    title: "Offer",
    route: "/offer",
    template: "landing",
    navVisible: false,
    seoTitle: "",
    metaDescription: "",
  }).site.pages.find((page) => page.route === "/offer");
  const blank = createPage(defaultSiteDocument(), {
    title: "Plain",
    route: "/plain-cta",
    template: "blank",
    navVisible: false,
    seoTitle: "",
    metaDescription: "",
  }).site.pages.find((page) => page.route === "/plain-cta");
  assert.equal(landing?.sections.some((section) => section.editorName === "Call to action"), true);
  assert.equal(pageCapabilityFlags({ level: 2 }, landing ?? {}).editCta, true);
  assert.equal(blank?.sections.some((section) => section.editorName === "Call to action"), false);
  assert.equal(pageCapabilityFlags({ level: 2 }, { editCta: false }).editCta, false);
});
