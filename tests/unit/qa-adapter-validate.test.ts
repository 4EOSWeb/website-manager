import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { siteDraftSchema, zodFieldErrors } from "../../src/lib/content-schema.ts";
import { validateDocumentHook } from "../../adapters/quantum-age/validate.ts";
import { fakeContext } from "./platform-helpers.ts";
import { stackedPage } from "./fixtures/stacked-page.ts";

const currentInvalidDraft = "Invalid input: expected object, received undefined Invalid input: expected array, received undefined Invalid input: expected array, received undefined";

test("quantum age validation warns on a missing root and does not require a hero", () => {
  const source = readFileSync(new URL("../../adapters/quantum-age/validate.ts", import.meta.url), "utf8");
  assert.equal(source.includes('preset: "hero"'), false);
  assert.equal(source.includes("preset"), false);
  const route = readFileSync(new URL("../../src/app/api/sites/[websiteId]/draft/route.ts", import.meta.url), "utf8");
  const reader = readFileSync(new URL("../../src/lib/draft-put.ts", import.meta.url), "utf8");
  assert.equal(route.includes("readDraftPut"), true);
  assert.equal(reader.includes("siteDraftSchema"), true);
  assert.equal(route.includes("adapters/quantum-age/validate"), false);

  const rooted = validateDocumentHook(stackedPage, fakeContext("web_quantum_age"));
  assert.equal(rooted.ok, true);
  if (rooted.ok) assert.deepEqual(rooted.value.warnings, []);

  const missing = validateDocumentHook(
    { version: 1, pages: [{ id: "page_a10000000001", route: "/", title: "Home", metadata: {} }] },
    fakeContext("web_quantum_age"),
  );
  assert.equal(missing.ok, true);
  if (missing.ok) {
    assert.equal(missing.value.warnings.length, 1);
    assert.equal(missing.value.warnings[0]?.path, "pages.0.root");
  }

  const other = validateDocumentHook(
    { version: 1, pages: [{ id: "page_a10000000001", route: "/", title: "Home" }] },
    fakeContext("web_other"),
  );
  assert.equal(other.ok, true);
  if (other.ok) assert.deepEqual(other.value.warnings, []);

  const invalid = siteDraftSchema.safeParse({ version: 3 });
  assert.equal(invalid.success, false);
  if (!invalid.success) assert.equal(zodFieldErrors(invalid.error), currentInvalidDraft);
});
