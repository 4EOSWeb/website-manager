import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sample from "../fixtures/adapters/sample/adapter.ts";
import { formatAdapterError } from "../../src/platform/adapter/errors.ts";
import { parseAdapter } from "../../src/platform/adapter/index.ts";

test("a missing site id names that field", () => {
  const site = { ...sample.site };
  delete (site as { id?: string }).id;
  const missing = parseAdapter({ ...sample, site });
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    const formatted = formatAdapterError(missing.error);
    assert.equal(formatted.path, "site.id");
    assert.equal(formatted.code, "adapter_invalid");
    assert.equal(/quantum|insights|plum/i.test(formatted.message), false);
  }
  const source = readFileSync(new URL("../../src/platform/adapter/errors.ts", import.meta.url), "utf8");
  assert.equal(/quantum|insights|plum/i.test(source), false);
  const route = readFileSync(new URL("../../src/app/api/sites/[websiteId]/draft/route.ts", import.meta.url), "utf8");
  assert.equal(route.includes("zodFieldErrors"), true);
  assert.equal(route.includes("siteDraftSchema"), true);
});
