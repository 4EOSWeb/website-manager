import { test } from "node:test";
import assert from "node:assert/strict";
import { assertSameSite, type SiteContext } from "../../src/platform/context.ts";

function context(websiteId: string): SiteContext {
  return { clientId: "client_a", websiteId, repository: "example", branch: "main", actorId: "user_a" };
}

test("different website ids fail the site check", () => {
  const result = assertSameSite(context("site_a"), context("site_b"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "site_mismatch");
});

test("the same website id passes", () => {
  const result = assertSameSite(context("site_a"), context("site_a"));
  assert.equal(result.ok, true);
});
