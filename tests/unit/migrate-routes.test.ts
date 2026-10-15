import assert from "node:assert/strict";
import { test } from "node:test";
import { assertRoutesPreserved } from "../../src/platform/migrate/routes.ts";

test("dropping a route fails and the same set passes", () => {
  const routes = ["/", "/solutions", "/contact"];
  assert.equal(assertRoutesPreserved(routes, ["/contact", "/", "/solutions"]).ok, true);
  const dropped = assertRoutesPreserved(routes, ["/", "/solutions"]);
  assert.equal(dropped.ok, false);
  if (!dropped.ok) assert.equal(dropped.error.code, "migration_failed");
  assert.equal(assertRoutesPreserved(routes, ["/", "/contact", "/contact"]).ok, false);
});
