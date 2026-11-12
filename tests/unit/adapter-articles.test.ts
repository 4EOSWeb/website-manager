import { test } from "node:test";
import assert from "node:assert/strict";
import { activeArticlePattern, validateArticles } from "../../src/platform/adapter/articles.ts";

test("disabled articles keep a pattern that callers ignore", () => {
  const disabled = validateArticles(false, {
    enabled: false,
    routePattern: "/journal/:slug",
    body: "html-preserved",
  });
  assert.equal(disabled.ok, true);
  if (disabled.ok) assert.equal(activeArticlePattern(disabled.value), null);
  const enabled = validateArticles(true, {
    enabled: true,
    routePattern: "/journal/:slug",
    body: "structured",
  });
  assert.equal(enabled.ok, true);
  if (enabled.ok) assert.equal(activeArticlePattern(enabled.value), "/journal/:slug");
});
