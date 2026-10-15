import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { levelCapabilities } from "../../src/platform/adapter/level.ts";
import { canvasControlsVisible, formControlsVisible, libraryEntryVisible, themeControlsVisible } from "../../src/components/editor/inspector/capability-gate.ts";

test("flags false hide canvas, form, and theme controls", () => {
  const closed = { capabilities: { supportsFreeCanvas: false, supportsForms: false, supportsThemeEditing: false, ...levelCapabilities(1) } };
  assert.equal(canvasControlsVisible(closed), false);
  assert.equal(formControlsVisible(closed), false);
  assert.equal(themeControlsVisible(closed), false);
  assert.equal(libraryEntryVisible("element:canvas", closed), false);
  assert.equal(libraryEntryVisible("element:form", closed), false);
  assert.equal(libraryEntryVisible("element:input", closed), false);
  assert.equal(libraryEntryVisible("element:heading", closed), true);
  const open = { capabilities: levelCapabilities(2) };
  assert.equal(canvasControlsVisible(open), true);
  assert.equal(formControlsVisible(open), true);
  assert.equal(themeControlsVisible(open), true);
  assert.equal(libraryEntryVisible("element:canvas", open), true);
  assert.equal(libraryEntryVisible("element:checkbox", open), true);
  const source = [
    readFileSync("src/components/editor/library.tsx", "utf8"),
    readFileSync("src/components/editor/inspector/generated.tsx", "utf8"),
    readFileSync("src/components/editor/inspector/chrome.tsx", "utf8"),
    readFileSync("src/components/editor/inspector/capability-gate.ts", "utf8"),
  ].join("\n");
  assert.equal(source.includes("libraryEntryVisible"), true);
  assert.equal(source.includes("themeControlsVisible"), true);
  assert.equal(source.includes("canvasControlsVisible"), true);
  const lowered = readFileSync("src/components/editor/inspector/capability-gate.ts", "utf8").toLowerCase();
  assert.equal(lowered.includes("quantum"), false);
  assert.equal(lowered.includes("plum"), false);
  assert.equal(lowered.includes("hero"), false);
});
