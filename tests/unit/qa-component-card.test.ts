import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { componentDefinitionSchema } from "../../src/platform/adapter/components.ts";
import { nodeTypes } from "../../src/platform/document/node-type.ts";
import { createRegistry } from "../../src/platform/registry/register.ts";
import { quantumAgeCard } from "../../adapters/quantum-age/components/card.ts";

test("quantum age card defaults are empty and the platform has no card preset enum", () => {
  assert.equal(componentDefinitionSchema.safeParse(quantumAgeCard).success, true);
  assert.equal(createRegistry().register(quantumAgeCard).ok, true);
  assert.equal(quantumAgeCard.category, "content");
  assert.equal(quantumAgeCard.defaultProps.heading, "");
  assert.equal(quantumAgeCard.defaultProps.body, "");
  assert.equal(nodeTypes.includes("card"), true);
  const source = readFileSync(new URL("../../src/platform/document/node-type.ts", import.meta.url), "utf8");
  assert.equal(source.includes("quantum-age"), false);
  const scan = spawnSync("rg", ["quantum-age.card|Access leading experts", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
