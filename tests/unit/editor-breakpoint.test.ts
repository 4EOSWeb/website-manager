import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { breakpointWidth, previewRadioLabel } from "../../src/components/editor/state/breakpoint.ts";

test("quantum age device widths come from the adapter", () => {
  const config = JSON.parse(readFileSync(new URL("../../overlays/quantum-age/4eos.editor.config.json", import.meta.url), "utf8")) as {
    viewports: { id: "desktop" | "tablet" | "mobile"; width: number }[];
  };
  for (const viewport of config.viewports) {
    assert.equal(breakpointWidth(quantumAgeAdapter as unknown as Record<string, unknown>, viewport.id), viewport.width);
  }
  assert.equal(breakpointWidth(null, "desktop"), 1280);
  assert.equal(breakpointWidth(null, "tablet"), 768);
  assert.equal(breakpointWidth(null, "mobile"), 390);
  assert.deepEqual(previewRadioLabel, { desktop: "Desktop", tablet: "Tablet", mobile: "Phone" });
  const chrome = readFileSync(new URL("../../src/components/editor/chrome.tsx", import.meta.url), "utf8");
  assert.equal(chrome.includes("width:"), false);
  assert.equal(chrome.includes("onViewport(device.id)"), true);
});
