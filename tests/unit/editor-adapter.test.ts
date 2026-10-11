import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { editorAdapterForSite } from "../../src/lib/editor-adapter.ts";
import { editorAdapterView, loadEditorAdapter, version3EditorWarning } from "../../src/platform/editor-adapter.ts";

function containsFunction(value: unknown): boolean {
  if (typeof value === "function") return true;
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some(containsFunction);
}

test("the editor receives serializable adapter fields for the active site", async () => {
  const view = await loadEditorAdapter("web_quantum_age");
  assert.ok(view);
  assert.equal(view.id, "web_quantum_age");
  assert.equal(view.fields.version, 1);
  assert.equal("validateDocument" in view.fields, false);
  assert.equal("serialize" in view.fields, false);
  assert.equal(containsFunction(view), false);
  assert.deepEqual(JSON.parse(JSON.stringify(view)), view);
  const direct = editorAdapterView(quantumAgeAdapter);
  assert.equal(direct?.id, view.id);
  const throughPage = await editorAdapterForSite("web_quantum_age");
  assert.equal(throughPage?.id, "web_quantum_age");
  assert.equal(containsFunction(throughPage), false);
});

test("a missing adapter keeps the version 3 editor and warns", async () => {
  const warnings: unknown[] = [];
  const original = console.warn;
  console.warn = (message?: unknown) => {
    warnings.push(message);
  };
  try {
    const view = await loadEditorAdapter("web_missing");
    assert.equal(view, null);
    assert.deepEqual(warnings, [version3EditorWarning]);
  } finally {
    console.warn = original;
  }
});

test("a failed adapter import uses the bundled serializable view", async () => {
  const warnings: unknown[] = [];
  const original = console.warn;
  console.warn = (message?: unknown) => {
    warnings.push(message);
  };
  try {
    const view = await loadEditorAdapter("web_quantum_age", {
      root: path.join(process.cwd(), "tests/fixtures/editor-adapter-unavailable"),
      bundled: [quantumAgeAdapter],
    });
    assert.equal(view?.id, "web_quantum_age");
    assert.equal(containsFunction(view), false);
    assert.equal(warnings.length, 0);
    const missing = await loadEditorAdapter("web_missing", {
      root: path.join(process.cwd(), "tests/fixtures/editor-adapter-unavailable"),
      bundled: [],
    });
    assert.equal(missing, null);
    assert.deepEqual(warnings, [version3EditorWarning]);
  } finally {
    console.warn = original;
  }
});

test("the editor page does not import overlay components", () => {
  const page = readFileSync(new URL("../../src/app/sites/[websiteId]/editor/page.tsx", import.meta.url), "utf8");
  const platform = readFileSync(new URL("../../src/platform/editor-adapter.ts", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  assert.equal(page.includes("overlays/"), false);
  assert.equal(platform.includes("overlays/"), false);
  assert.equal(platform.includes("adapters/"), false);
  assert.equal(shell.includes("overlays/"), false);
  assert.equal(shell.includes("data-adapter={adapterId"), true);
});
