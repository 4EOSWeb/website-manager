import { test } from "node:test";
import assert from "node:assert/strict";
import type { FlowBlock, Section, SiteDraft } from "../../src/lib/content-schema.ts";
import {
  anchorFrom,
  changePageRoute,
  createPage,
  deleteFlowBlock,
  deleteSection,
  duplicateFlowBlock,
  duplicateSection,
  moveFlowBlock,
  moveSection,
  patchFlowBlock,
  setBlockHidden,
  setSectionAnchor,
  setSectionHidden,
  slugify,
} from "../../src/lib/editor-ops.ts";
import { defaultSiteDocument } from "../../src/lib/flow-seed.ts";
import { linkProblem, validLink } from "../../src/lib/links.ts";

const HOME = "/";

function home(site: SiteDraft) {
  const page = site.pages.find((item) => item.route === HOME);
  assert.ok(page, "the default site has a home page");
  return page;
}

function ids(site: SiteDraft) {
  return home(site).sections.map((section) => section.id);
}

function flow(site: SiteDraft, index = 0): Extract<Section, { type: "flow" }> {
  const section = home(site).sections[index];
  assert.equal(section?.type, "flow");
  return section as Extract<Section, { type: "flow" }>;
}

function block(site: SiteDraft, sectionIndex: number, blockId: string): FlowBlock | undefined {
  return flow(site, sectionIndex).blocks.find((item) => item.id === blockId);
}

test("moving a section reorders it without touching the others", () => {
  const site = defaultSiteDocument();
  const before = ids(site);
  const moved = moveSection(site, HOME, 0, 3);
  assert.deepEqual(ids(moved), [before[1], before[2], before[0], ...before.slice(3)]);
  assert.deepEqual(ids(site), before, "the original draft is not mutated");
});

test("moving a section onto its own slot changes nothing", () => {
  const site = defaultSiteDocument();
  assert.equal(home(moveSection(site, HOME, 2, 2)), home(site));
  assert.equal(home(moveSection(site, HOME, 2, 3)), home(site));
});

test("duplicating a section inserts a copy after it with new ids and no anchor", () => {
  const site = setSectionAnchor(defaultSiteDocument(), HOME, ids(defaultSiteDocument())[0], "Top of page");
  const first = home(site).sections[0];
  assert.equal(first.anchor, "top-of-page");
  const copy = home(duplicateSection(site, HOME, first.id)).sections[1];
  assert.notEqual(copy.id, first.id);
  assert.equal(copy.type, first.type);
  assert.equal(copy.anchor, undefined, "anchors stay unique on the page");
});

test("hiding a section keeps it in the draft", () => {
  const site = defaultSiteDocument();
  const target = ids(site)[1];
  const hidden = setSectionHidden(site, HOME, target, true);
  assert.equal(home(hidden).sections[1].hidden, true);
  assert.equal(home(setSectionHidden(hidden, HOME, target, false)).sections[1].hidden, false);
  assert.equal(home(hidden).sections.length, home(site).sections.length);
});

test("deleting a section removes only that section", () => {
  const site = defaultSiteDocument();
  const target = ids(site)[2];
  const next = deleteSection(site, HOME, target);
  assert.deepEqual(ids(next), ids(site).filter((id) => id !== target));
});

test("locked pages ignore structural changes", () => {
  const site = defaultSiteDocument();
  const locked = { ...site, pages: site.pages.map((page) => (page.route === HOME ? { ...page, locked: true } : page)) };
  const target = ids(locked)[0];
  assert.deepEqual(ids(moveSection(locked, HOME, 0, 3)), ids(locked));
  assert.deepEqual(ids(duplicateSection(locked, HOME, target)), ids(locked));
  assert.deepEqual(ids(deleteSection(locked, HOME, target)), ids(locked));
});

test("blocks move, duplicate, hide, and delete inside a flow section", () => {
  const site = defaultSiteDocument();
  const section = flow(site);
  const [a, b] = section.blocks;
  const moved = moveFlowBlock(site, HOME, section.id, 0, 2);
  assert.deepEqual(flow(moved).blocks.slice(0, 2).map((item) => item.id), [b.id, a.id]);

  const duplicated = flow(duplicateFlowBlock(site, HOME, section.id, a.id));
  assert.equal(duplicated.blocks.length, section.blocks.length + 1);
  assert.notEqual(duplicated.blocks[1].id, a.id);
  assert.deepEqual(duplicated.blocks[1].text, a.text);

  const hidden = setBlockHidden(site, HOME, section.id, a.id, true);
  assert.equal(block(hidden, 0, a.id)?.hidden, true);

  const deleted = deleteFlowBlock(site, HOME, section.id, a.id);
  assert.equal(block(deleted, 0, a.id), undefined);
});

test("locked blocks cannot be hidden, duplicated, deleted, or restyled", () => {
  const site = defaultSiteDocument();
  const section = flow(site);
  const rings = section.blocks.find((item) => item.locked);
  assert.ok(rings, "the hero keeps its locked brand mark");
  assert.equal(block(setBlockHidden(site, HOME, section.id, rings.id, true), 0, rings.id)?.hidden, false);
  assert.equal(flow(duplicateFlowBlock(site, HOME, section.id, rings.id)).blocks.length, section.blocks.length);
  assert.ok(block(deleteFlowBlock(site, HOME, section.id, rings.id), 0, rings.id));
  assert.equal(block(patchFlowBlock(site, HOME, section.id, rings.id, { textStyle: { weight: "bold" } }), 0, rings.id)?.textStyle, undefined);
});

test("text style patches merge, and clearing a step removes it", () => {
  const site = defaultSiteDocument();
  const section = flow(site);
  const heading = section.blocks.find((item) => item.kind === "heading");
  assert.ok(heading);
  const styled = patchFlowBlock(site, HOME, section.id, heading.id, { textStyle: { preset: "title", weight: "bold" } });
  const aligned = patchFlowBlock(styled, HOME, section.id, heading.id, { textStyle: { align: "center" } });
  assert.deepEqual(block(aligned, 0, heading.id)?.textStyle, { preset: "title", weight: "bold", align: "center" });
  const cleared = patchFlowBlock(aligned, HOME, section.id, heading.id, { textStyle: { weight: undefined } });
  assert.deepEqual(block(cleared, 0, heading.id)?.textStyle, { preset: "title", align: "center" });
});

test("anchors are cleaned, limited, and unique per page", () => {
  assert.equal(anchorFrom("  Our Services! "), "our-services");
  assert.equal(anchorFrom("2024 plans"), "plans");
  assert.equal(anchorFrom("!!!"), undefined);
  assert.equal(anchorFrom("a".repeat(60))?.length, 40);
  const site = defaultSiteDocument();
  const [first, second] = ids(site);
  const named = setSectionAnchor(site, HOME, first, "services");
  assert.equal(setSectionAnchor(named, HOME, second, "Services"), named, "a duplicate anchor is refused");
  assert.equal(home(setSectionAnchor(named, HOME, first, "")).sections[0].anchor, undefined);
});

test("slugify makes a short lowercase address", () => {
  assert.equal(slugify("Memory Care & Assisted Living"), "memory-care-assisted-living");
  assert.equal(slugify("  --Hello--  "), "hello");
  assert.equal(slugify("!!!"), "page");
  assert.ok(slugify("x".repeat(80)).length <= 48);
});

test("new pages need a valid, unused address", () => {
  const site = defaultSiteDocument();
  const input = { title: "Careers", route: "/careers", template: "blank" as const, navVisible: true, seoTitle: "", metaDescription: "" };
  const created = createPage(site, input);
  assert.equal(created.error, undefined);
  assert.ok(created.site.pages.some((page) => page.route === "/careers"));
  assert.equal(createPage(site, { ...input, route: "careers" }).error, undefined, "a missing slash is added");
  for (const bad of ["/Careers", "/two words", "/trailing-", "/a/b", "/"]) {
    assert.ok(createPage(site, { ...input, route: bad }).error, `${bad} is rejected`);
  }
  assert.equal(createPage(site, { ...input, route: "/about" }).error, "That address is already used.");
  assert.equal(createPage(created.site, input).error, "That address is already used.");
});

test("links accept site paths, https, email, and phone only", () => {
  for (const good of ["/contact", "/insights/a-post#top", "https://example.com/x", "mailto:askQA@quantum-age.com", "tel:+1 440 638 6990"]) {
    assert.equal(validLink(good), true, good);
    assert.equal(linkProblem(good), "");
  }
  for (const bad of ["contact", "javascript:alert(1)", "https://", "ftp://example.com", "mailto:nobody"]) {
    assert.equal(validLink(bad), false, bad);
  }
  assert.match(linkProblem("http://example.com"), /secure https/);
  assert.match(linkProblem(""), /Add where/);
});

test("a created page can move to a new address, and links follow it", () => {
  const base = defaultSiteDocument();
  const input = { title: "Careers", route: "/careers", template: "blank" as const, navVisible: true, seoTitle: "", metaDescription: "" };
  let site = createPage(base, input).site;
  site = createPage(site, { ...input, title: "Openings", route: "/openings" }).site;
  site = { ...site, pages: site.pages.map((page) => (page.route === "/openings" ? { ...page, parentRoute: "/careers" } : page)) };
  const hero = home(site).sections[0] as Extract<Section, { type: "flow" }>;
  const button = hero.blocks.find((item) => item.kind === "button");
  assert.ok(button);
  site = patchFlowBlock(site, HOME, hero.id, button.id, { href: "/careers#roles" });

  const moved = changePageRoute(site, "/careers", "jobs");
  assert.equal(moved.error, undefined);
  assert.equal(moved.route, "/jobs");
  assert.ok(moved.site.pages.some((page) => page.route === "/jobs"));
  assert.ok(!moved.site.pages.some((page) => page.route === "/careers"));
  assert.equal(moved.site.pages.find((page) => page.route === "/openings")?.parentRoute, "/jobs");
  assert.equal(block(moved.site, 0, button.id)?.href, "/jobs#roles");

  assert.equal(changePageRoute(site, "/careers", "/Bad Address").error, "Use a short address such as /new-service.");
  assert.equal(changePageRoute(site, "/careers", "/openings").error, "That address is already used.");
  assert.equal(changePageRoute(site, "/careers", "/contact").error, "That address is already used.");
  assert.ok(changePageRoute(site, "/about", "/about-us").error, "built-in pages keep their address");
  assert.equal(changePageRoute(site, "/careers", "/careers").site, site);
});
