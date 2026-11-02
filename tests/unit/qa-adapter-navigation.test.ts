import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { validateNavigation } from "../../src/platform/adapter/navigation.ts";
import { quantumAgeNavigation } from "../../adapters/quantum-age/navigation.ts";

test("quantum age navigation comes from the document and has no label list", () => {
  const checked = validateNavigation(true, quantumAgeNavigation);
  assert.equal(checked.ok, true);
  if (checked.ok) {
    assert.equal(checked.value.source, "document");
    assert.equal(checked.value.editable, true);
    assert.equal(checked.value.items, undefined);
  }
  const source = readFileSync(new URL("../../adapters/quantum-age/navigation.ts", import.meta.url), "utf8");
  assert.equal(source.includes("Start a conversation"), false);
  assert.equal(source.includes("Privacy Policy"), false);
  const scan = spawnSync("rg", ["-n", "Start a conversation|Privacy Policy", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
