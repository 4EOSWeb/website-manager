import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { adminLabels, fieldVisible } from "../../src/components/editor/inspector/mode-filter.ts";

test("a client editor does not receive administrator fields", () => {
  assert.deepEqual(adminLabels("administrator", false, true), []);
  assert.deepEqual(adminLabels("advanced", true, true), []);
  assert.deepEqual(adminLabels("basic", true, false), []);
  assert.equal(fieldVisible("adapterPath", "administrator", false), false);
  assert.equal(fieldVisible("componentId", "advanced", true), false);
  const admin = adminLabels("administrator", true, false);
  assert.equal(admin.includes("Component id"), true);
  assert.equal(admin.includes("Lock id"), true);
  assert.equal(admin.includes("Adapter id"), true);
  assert.equal(admin.includes("Embed URL"), false);
  assert.equal(adminLabels("administrator", true, true).includes("Embed URL"), true);
  const source = readFileSync("src/components/editor/inspector/admin-fields.tsx", "utf8");
  assert.equal(source.includes("readOnly"), true);
  assert.equal(source.includes("adminLabels"), true);
  assert.equal(source.includes("data-admin-fields"), true);
  const lowered = `${source}\n${readFileSync("src/components/editor/inspector/mode-filter.ts", "utf8")}`.toLowerCase();
  assert.equal(lowered.includes("quantum"), false);
  assert.equal(lowered.includes("plum"), false);
  assert.equal(lowered.includes("hero"), false);
});
