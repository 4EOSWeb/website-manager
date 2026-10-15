import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pageSchema } from "../../src/platform/document/page.ts";
import { isPlatformId } from "../../src/platform/ids.ts";

const page = {
  id: "page_0123456789ab",
  route: "/example",
  title: "Example",
  metadata: {},
  root: null,
};

test("a page without a title fails", () => {
  const { title: _title, ...rest } = page;
  assert.equal(pageSchema.safeParse(rest).success, false);
  assert.equal(pageSchema.safeParse(page).success, true);
  assert.equal(pageSchema.safeParse({ ...page, id: "page_home" }).success, false);
  assert.equal(isPlatformId("page_home"), false);
  const source = readFileSync(new URL("../../src/platform/document/page.ts", import.meta.url), "utf8");
  assert.equal(/insights|hero|quantum age/i.test(source), false);
});
