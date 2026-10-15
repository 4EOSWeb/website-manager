import { test } from "node:test";
import assert from "node:assert/strict";
import { discoverStaticRoutes } from "../../src/platform/adapter/routes.ts";
import { fakeContext } from "./platform-helpers.ts";

test("static routes pass and a full URL fails", async () => {
  const found = await discoverStaticRoutes([{ path: "/notes", title: "Notes" }])(fakeContext("site_example"));
  assert.equal(found.ok, true);
  if (found.ok) assert.deepEqual(found.value, [{ path: "/notes", title: "Notes" }]);
  const url = await discoverStaticRoutes([{ path: "https://example.com", title: "Off site" }])(fakeContext("site_example"));
  assert.equal(url.ok, false);
});
