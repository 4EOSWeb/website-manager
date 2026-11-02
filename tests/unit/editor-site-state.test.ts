import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fakeContext } from "./platform-helpers.ts";
import { activeSiteContext, createSiteState, draftForSite, resetForSite } from "../../src/components/editor/state/site.ts";

test("resetForSite clears page and selection", () => {
  const state = createSiteState(fakeContext("web_a"), "page_home", ["node_heading"]);
  const next = resetForSite(state, "web_b");
  assert.equal(next.site.websiteId, "web_b");
  assert.equal(next.pageId, null);
  assert.deepEqual(next.selection, []);
  assert.equal(next.site.clientId, "");
  assert.equal(next.site.repository, "");
  assert.equal(next.site.branch, "");
  assert.equal(next.site.actorId, state.site.actorId);
  const same = resetForSite(state, "web_a");
  assert.equal(same.pageId, "page_home");
  assert.deepEqual(same.selection, ["node_heading"]);
});

test("the editor route uses only the URL website id", () => {
  const stored = fakeContext("web_other");
  const active = activeSiteContext(stored, "web_quantum_age");
  assert.equal(active.websiteId, "web_quantum_age");
  assert.equal(active.repository, "");
  assert.equal(active.clientId, "");
  assert.equal(activeSiteContext(fakeContext("web_quantum_age"), "web_quantum_age").repository, "example/site");
  const row = { websiteId: "web_quantum_age", draftData: { version: 3 } };
  assert.equal(draftForSite("web_quantum_age", row), row);
  assert.equal(draftForSite("web_other", row), null);
  assert.equal(draftForSite("web_quantum_age", null), null);
  const page = readFileSync(new URL("../../src/app/sites/[websiteId]/editor/page.tsx", import.meta.url), "utf8");
  assert.equal(page.includes("draftForSite(websiteId, draft)"), true);
  assert.equal(page.includes("actor.website.id !== websiteId"), true);
});
