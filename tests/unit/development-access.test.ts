import { test } from "node:test";
import assert from "node:assert/strict";
import { developmentAccess } from "../../src/app/signin/development-access.ts";

test("development access is hidden when development auth is off", () => {
  assert.equal(developmentAccess(false), null);
  const shown = developmentAccess(true);
  assert.equal(shown?.title, "Development access");
  assert.match(shown?.note ?? "", /local copy/);
});
