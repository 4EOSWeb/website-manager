import { test } from "node:test";
import assert from "node:assert/strict";
import { siteIdProblem } from "../../src/app/sites/new/site-id.ts";

test("a site id is lowercase, unique, and kept when it is valid", () => {
  assert.equal(siteIdProblem("ab", false).length > 0, true);
  assert.equal(siteIdProblem("Web_harbor", false).length > 0, true);
  assert.equal(siteIdProblem("web_quantum_age", true), "That id is already used.");
  assert.equal(siteIdProblem("web_new_site", false), "");
  assert.equal(siteIdProblem("web_harbor", false), "");
});
