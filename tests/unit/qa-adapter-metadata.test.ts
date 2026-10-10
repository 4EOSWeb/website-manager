import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { siteMetadataSchema } from "../../src/platform/adapter/metadata.ts";
import { quantumAgeMetadata } from "../../adapters/quantum-age/metadata.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";

test("quantum age metadata matches the editor config", () => {
  const config = JSON.parse(readFileSync(new URL("../../overlays/quantum-age/4eos.editor.config.json", import.meta.url), "utf8")) as {
    websiteId: string;
    name: string;
    productionUrl: string;
    defaultBranch: string;
    github: { owner: string; repository: string };
  };
  const parsed = siteMetadataSchema.safeParse(quantumAgeMetadata);
  assert.equal(parsed.success, true);
  assert.equal(quantumAgeMetadata.id, "web_quantum_age");
  assert.equal(quantumAgeMetadata.id, config.websiteId);
  assert.equal(quantumAgeMetadata.name, config.name);
  assert.equal(quantumAgeMetadata.productionUrl, config.productionUrl);
  assert.deepEqual(quantumAgeMetadata.repository, { owner: config.github.owner, name: config.github.repository });
  assert.equal(quantumAgeMetadata.defaultBranch, config.defaultBranch);
  assert.deepEqual(quantumAgeAdapter.site, quantumAgeMetadata);
  assert.equal("version" in quantumAgeAdapter, false);
  const scan = spawnSync("rg", ["-n", "adapters/quantum-age", "src/platform", "src/components"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
