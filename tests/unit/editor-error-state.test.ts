import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dismissEditorError, editorErrorFromAdapter, editorErrorFromSave, presentErrorMessage } from "../../src/components/editor/state/errors.ts";
import { documentInvalid } from "../../src/platform/errors.ts";

test("an editor error keeps the message and drops the stack", () => {
  const saved = editorErrorFromSave({
    code: "document_invalid",
    message: "The page document is not valid.\n    at readDraftPut (draft-put.ts:20:5)",
  });
  assert.equal(saved.code, "document_invalid");
  assert.equal(saved.message, "The page document is not valid.");
  assert.equal(saved.message.includes("draft-put.ts"), false);
  const adapter = editorErrorFromAdapter(documentInvalid("The page document is not valid."));
  assert.equal(adapter.code, "document_invalid");
  assert.equal(presentErrorMessage("boom\n    at Module._compile (node:internal:1:1)").includes("node:internal"), false);
});

test("dismissing an error keeps the typed document", () => {
  const document = { title: "Offline edit" };
  const dismissed = dismissEditorError(document);
  assert.equal(dismissed.error, null);
  assert.equal(dismissed.document, document);
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  const dismiss = shell.slice(shell.indexOf('aria-label="Dismiss"'), shell.indexOf('aria-label="Dismiss"') + 280);
  assert.equal(dismiss.includes("dismissEditorError"), true);
  assert.equal(dismiss.includes("setSite("), false);
});
