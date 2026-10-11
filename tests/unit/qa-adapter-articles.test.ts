import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { articlesSchema } from "../../src/platform/adapter/articles.ts";
import { componentDefinitionSchema } from "../../src/platform/adapter/components.ts";
import { quantumAgeArticles } from "../../adapters/quantum-age/articles.ts";
import { quantumAgeInsightsSummary } from "../../adapters/quantum-age/components/insights.ts";

test("quantum age article behavior stays out of the platform", () => {
  assert.equal(articlesSchema.safeParse(quantumAgeArticles).success, true);
  assert.equal(quantumAgeArticles.routePattern, "/insights/:slug");
  assert.equal(quantumAgeArticles.body, "html-preserved");
  assert.equal(componentDefinitionSchema.safeParse(quantumAgeInsightsSummary).success, true);
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  assert.equal(shell.includes("/insights/"), true);
  const scan = spawnSync("rg", ["insights", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
