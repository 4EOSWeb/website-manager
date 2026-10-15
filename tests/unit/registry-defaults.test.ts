import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyDefaults } from "../../src/platform/registry/defaults.ts";

test("defaults fill missing props and keep provided ones", () => {
  const definition = { defaultProps: { label: "Go", href: "/" } };
  assert.equal(applyDefaults(definition, {}).label, "Go");
  assert.equal(applyDefaults(definition, { label: "Start" }).label, "Start");
  assert.equal(applyDefaults(definition, { label: "Start" }).href, "/");
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  assert.equal(shell.includes("insertSection"), true);
  assert.equal(shell.includes("addFlowBlock"), true);
  assert.equal(shell.includes("applyDefaults"), false);
});
