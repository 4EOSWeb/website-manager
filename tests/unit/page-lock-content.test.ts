import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { layoutChangeRefused } from "../../src/components/editor/inspector/layout-lock.ts";
import { pageCapabilityFlags } from "../../src/components/editor/inspector/page-controls.ts";

test("locked content blocks text edits and still allows a layout change", () => {
  const locked = pageCapabilityFlags({ level: 2, pageCapabilities: { lockContent: true, lockLayout: false, editBody: true } }, {});
  assert.equal(locked.lockContent, true);
  assert.equal(locked.lockLayout, false);
  assert.equal(layoutChangeRefused(locked, false), "");
  const page = pageCapabilityFlags({ level: 2 }, { locked: true });
  assert.equal(page.lockContent, true);
  assert.equal(page.editBody, false);
  const open = pageCapabilityFlags({ level: 2 }, { locked: false });
  assert.equal(open.lockContent, false);
  const source = readFileSync("src/components/editor/inspector/page.tsx", "utf8");
  assert.equal(source.includes("This content is locked."), true);
});
