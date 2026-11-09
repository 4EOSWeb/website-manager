import assert from "node:assert/strict";
import test from "node:test";
import { capabilityLines, commandLines, levelLine } from "../../src/app/sites/[websiteId]/settings/settings-model.ts";

test("settings labels name the capability in a sentence", () => {
  const lines = capabilityLines({ supportsPageCreation: true, supportsReviewPublishing: false });
  assert.equal(lines.find((line) => line.label === "Can create pages")?.value, "Yes");
  assert.equal(lines.find((line) => line.label === "Can send for review")?.value, "No");
  assert.equal(lines.some((line) => line.label.includes("supportsPageCreation")), false);
  assert.equal(levelLine(2), "Level 2");
  assert.deepEqual(commandLines({ dev: "npm run dev" })[1], { label: "Development", value: "npm run dev" });
});
