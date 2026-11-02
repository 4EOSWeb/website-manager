import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { componentDefinitionSchema } from "../../src/platform/adapter/components.ts";
import { createRegistry } from "../../src/platform/registry/register.ts";
import { quantumAgeFooter } from "../../adapters/quantum-age/components/footer.ts";

test("the quantum age footer definition validates and the hub does not import it", () => {
  assert.equal(componentDefinitionSchema.safeParse(quantumAgeFooter).success, true);
  assert.equal(createRegistry().register(quantumAgeFooter).ok, true);
  assert.deepEqual(Object.keys(quantumAgeFooter.defaultProps), ["copyright", "note", "links", "contact", "social", "images"]);
  assert.equal(quantumAgeFooter.locking.locked, true);
  assert.equal(quantumAgeFooter.renderer.exportName, "SiteFooter");
  const source = readFileSync(new URL("../../adapters/quantum-age/components/footer.ts", import.meta.url), "utf8");
  assert.equal(source.includes("site-footer"), false);
  const scan = spawnSync("rg", ["from ['\\\"].*site-footer", "src"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
