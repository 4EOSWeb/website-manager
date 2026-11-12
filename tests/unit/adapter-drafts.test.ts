import { test } from "node:test";
import assert from "node:assert/strict";
import { draftsSchema } from "../../src/platform/adapter/drafts.ts";

test("draft scope requires website and the visual document format", () => {
  assert.equal(draftsSchema.safeParse({
    scope: ["client", "website", "branch", "page", "user"],
    format: "visual-document-v1",
  }).success, true);
  assert.equal(draftsSchema.safeParse({
    scope: ["client", "branch", "page", "user"],
    format: "visual-document-v1",
  }).success, false);
  assert.equal(draftsSchema.safeParse({
    scope: ["client", "website", "branch", "page", "user"],
    format: "site-json",
  }).success, false);
});
