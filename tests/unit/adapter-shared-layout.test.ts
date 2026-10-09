import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSharedLayout } from "../../src/platform/adapter/shared-layout.ts";

test("shared header follows the capability flag", () => {
  const blocked = validateSharedLayout(false, { header: "required", footer: "none" });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.error.path, "sharedLayout.header");
  assert.equal(validateSharedLayout(true, { header: "optional", footer: "none" }).ok, true);
  const source = readFileSync(new URL("../../src/platform/adapter/shared-layout.ts", import.meta.url), "utf8");
  assert.equal(/href|label/.test(source), false);
});
