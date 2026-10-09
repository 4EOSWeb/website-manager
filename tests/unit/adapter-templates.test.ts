import { test } from "node:test";
import assert from "node:assert/strict";
import { templateSchema } from "../../src/platform/adapter/templates.ts";
import { stackedPage } from "./fixtures/stacked-page.ts";

test("a stacked document is a valid template and an empty document is not", () => {
  const valid = templateSchema.safeParse({
    id: "stacked",
    name: "Stacked",
    description: "A heading and a paragraph.",
    document: stackedPage,
  });
  assert.equal(valid.success, true);
  assert.equal(templateSchema.safeParse({
    id: "empty",
    name: "Empty",
    description: "Missing pages.",
    document: { version: 1, pages: [] },
  }).success, false);
});
