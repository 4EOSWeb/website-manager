import assert from "node:assert/strict";
import test from "node:test";
import { dashboardActions } from "../../src/app/sites/[websiteId]/dashboard-actions.ts";

test("review appears only when the site supports it", () => {
  const harbor = dashboardActions("web_harbor", false).map((action) => action.label);
  const quantum = dashboardActions("web_quantum_age", true).map((action) => action.label);
  assert.deepEqual(harbor, ["Edit", "Pages", "Media"]);
  assert.deepEqual(quantum, ["Edit", "Pages", "Media", "Review"]);
  assert.equal(dashboardActions("web_harbor", false).every((action) => action.href === "/sites/web_harbor/editor"), true);
});
