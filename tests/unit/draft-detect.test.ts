import assert from "node:assert/strict";
import { test } from "node:test";
import { detectionFailure, detectVersion } from "../../src/platform/migrate/detect.ts";
import { stackedPage } from "./fixtures/stacked-page.ts";

const version3 = {
  version: 3,
  chrome: { theme: { ink: "#231a25" } },
  pages: [{ id: "page_0123456789ab", route: "/", title: "Home" }],
};

const blogPost = {
  title: "A note from the team",
  slug: "a-note-from-the-team",
  blocks: [{ type: "paragraph", text: "Hello" }],
};

test("detectVersion returns 3, 1, or unknown without changing the value", () => {
  assert.equal(detectVersion(version3), 3);
  assert.equal(detectionFailure(version3), null);

  assert.equal(detectVersion(stackedPage), 1);
  assert.equal(detectionFailure(stackedPage), null);

  const before = structuredClone(blogPost);
  assert.equal(detectVersion(blogPost), "unknown");
  assert.equal(detectionFailure(blogPost)?.code, "migration_failed");
  assert.deepEqual(blogPost, before);
  assert.equal(detectVersion({ version: 3, pages: [] }), "unknown");
  assert.equal(detectVersion({ version: 1, pages: [] }), "unknown");
});
