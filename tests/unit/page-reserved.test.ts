import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { quantumAgePageRules } from "../../adapters/quantum-age/page-rules.ts";
import { changePageRoute, createPage } from "../../src/lib/editor-ops.ts";
import { defaultSiteDocument } from "../../src/lib/flow-seed.ts";
import { reservedRoutesOf, routeReserved } from "../../src/platform/pages/reserved.ts";

test("reserved routes come from the adapter", () => {
  const qa = { pageRules: quantumAgePageRules };
  const open = { pageRules: { reservedRoutes: ["/kept"] } };
  assert.equal(routeReserved("/insights", qa), true);
  assert.equal(routeReserved("/insights", open), false);
  const made = createPage(defaultSiteDocument(), {
    title: "Notes",
    route: "/notes",
    template: "blank",
    navVisible: true,
    seoTitle: "",
    metaDescription: "",
  }, reservedRoutesOf(open));
  assert.equal(made.error, undefined);
  const openSite = { ...made.site, pages: made.site.pages.filter((page) => page.route !== "/insights") };
  const accepted = changePageRoute(openSite, "/notes", "/insights", reservedRoutesOf(open));
  assert.equal(accepted.error, undefined);
  assert.equal(accepted.route, "/insights");
  const refused = changePageRoute(openSite, "/notes", "/insights", reservedRoutesOf(qa));
  assert.equal(refused.error, "That address is already used.");
  const home = changePageRoute(defaultSiteDocument(), "/", "/elsewhere", reservedRoutesOf(qa));
  assert.equal(home.error, "This page keeps its address.");
  const source = readFileSync("src/platform/pages/reserved.ts", "utf8").toLowerCase();
  assert.equal(source.includes("insights"), false);
  assert.equal(source.includes("quantum"), false);
  const scan = spawnSync("rg", ["BUILT_IN_ROUTES|const RESERVED", "src/lib"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
