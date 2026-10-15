import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { parseAdapter } from "../../src/platform/adapter/index.ts";
import { discoverAdapters } from "../../src/platform/discover-adapters.ts";

test("the quantum age adapter parses and discovery returns its id", async () => {
  const parsed = parseAdapter(quantumAgeAdapter);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.site.id, "web_quantum_age");
    assert.equal(parsed.value.level, 2);
    assert.equal(parsed.value.capabilities.supportsReviewPublishing, true);
    assert.equal(parsed.value.publish.mode, "review-branch");
    assert.equal(parsed.value.publish.allowlist.length > 0, true);
  }
  const discovered = await discoverAdapters("adapters");
  assert.equal(discovered.ok, true);
  if (discovered.ok) assert.equal(discovered.value.includes("web_quantum_age"), true);
  const platform = readFileSync(new URL("../../src/platform/index.ts", import.meta.url), "utf8");
  assert.equal(platform.includes("adapters/"), false);
  const scan = spawnSync("rg", ["-i", "quantum|heroimage|brand-mark|plum", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
