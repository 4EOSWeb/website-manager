import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { layoutChangeRefused } from "../../src/components/editor/inspector/layout-lock.ts";
import { pageCapabilityFlags } from "../../src/components/editor/inspector/page-controls.ts";

test("a locked layout hides conversion and still allows text when content is open", () => {
  assert.equal(layoutChangeRefused({ lockLayout: true }, false), "This page keeps its layout.");
  assert.equal(layoutChangeRefused({ lockLayout: true }, true), "");
  assert.equal(layoutChangeRefused({ lockLayout: false }, false), "");
  const locked = pageCapabilityFlags({ level: 2 }, { locked: true });
  assert.equal(locked.lockLayout, true);
  const open = pageCapabilityFlags({ level: 2, pageCapabilities: { lockLayout: true, lockContent: false, editBody: true } }, { locked: false });
  assert.equal(open.lockLayout, true);
  assert.equal(open.lockContent, false);
  assert.equal(open.editBody, true);
  const canvas = pageCapabilityFlags({ level: 2 }, { locked: false });
  assert.equal(canvas.lockLayout, false);
  const source = readFileSync("src/components/editor/inspector/layout-fields.tsx", "utf8");
  assert.equal(source.includes("This page keeps its layout."), true);
  assert.equal(source.includes("props.locked"), true);
});
