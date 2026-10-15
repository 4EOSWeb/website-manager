import { test } from "node:test";
import assert from "node:assert/strict";
import { documentHookError, defaultValidateDocumentHook, type ValidateDocumentHook } from "../../src/platform/adapter/validate-hook.ts";
import { ok } from "../../src/platform/result.ts";
import { fakeContext } from "./platform-helpers.ts";
import { stackedPage } from "./fixtures/stacked-page.ts";

test("the default hook accepts a document and a warning does not throw", () => {
  const passed = defaultValidateDocumentHook(stackedPage, fakeContext("sample"));
  assert.equal(passed.ok, true);
  if (passed.ok) assert.deepEqual(passed.value.warnings, []);

  const warningHook: ValidateDocumentHook = () => ok({
    warnings: [{ path: "pages.0.title", message: "Check the title." }],
  });
  const warned = warningHook(stackedPage, fakeContext("sample"));
  assert.equal(warned.ok, true);
  if (warned.ok) {
    assert.equal(warned.value.warnings.length, 1);
    assert.equal(warned.value.warnings[0]?.path, "pages.0.title");
  }

  const failed = documentHookError();
  assert.equal(failed.ok, false);
  if (!failed.ok) assert.equal(failed.error.code, "document_invalid");
});
