import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pageCapabilityFlags, showBody, showMetadata } from "../../src/components/editor/inspector/page-controls.ts";

test("a provider-managed page hides body editing and a normal page shows metadata", () => {
  const adapter = { level: 2, pageCapabilities: { editMetadata: true, editBody: true } };
  const normal = pageCapabilityFlags(adapter, { locked: false });
  const managed = pageCapabilityFlags(adapter, { locked: true });
  assert.equal(showMetadata(normal), true);
  assert.equal(showBody(normal), true);
  assert.equal(showMetadata(managed), true);
  assert.equal(showBody(managed), false);
  assert.equal(managed.providerManaged, true);
  const hidden = pageCapabilityFlags({ level: 2, pageCapabilities: { editMetadata: false, editBody: true } }, { locked: false });
  assert.equal(showMetadata(hidden), false);
  const source = readFileSync("src/components/editor/inspector/page.tsx", "utf8");
  assert.equal(source.includes("/privacy"), false);
  assert.equal(source.includes("/terms"), false);
  assert.equal(source.includes("/contact"), false);
  assert.equal(source.includes("/insights"), false);
  const lowered = readFileSync("src/components/editor/inspector/page-controls.ts", "utf8").toLowerCase();
  assert.equal(lowered.includes("quantum"), false);
  assert.equal(lowered.includes("privacy"), false);
  assert.equal(lowered.includes("hero"), false);
});
