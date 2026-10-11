import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

test("the quantum age seed lives in the adapter", () => {
  const seed = readFileSync(new URL("../../adapters/quantum-age/seed.ts", import.meta.url), "utf8");
  assert.equal(seed.includes("Quantum Age"), true);
  const reexport = readFileSync(new URL("../../src/lib/flow-seed.ts", import.meta.url), "utf8");
  assert.equal(reexport.includes("step 19.25"), true);
  assert.equal(reexport.includes("adapters/quantum-age/seed.ts"), true);
  const scan = spawnSync("rg", ["Quantum Age", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
