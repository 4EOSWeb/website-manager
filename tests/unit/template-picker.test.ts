import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { quantumAgeTemplates } from "../../adapters/quantum-age/templates.ts";
import { platformTemplates, templateChoices } from "../../src/platform/templates/catalog.ts";

test("the page picker lists platform templates plus the adapter templates", () => {
  assert.equal(platformTemplates.some((item) => item.name === "Blank canvas"), true);
  const sample = templateChoices({ templates: { templates: [{ id: "journal", name: "Journal" }] } });
  assert.equal(sample.some((item) => item.name === "Blank canvas"), true);
  assert.equal(sample.some((item) => item.name === "Journal"), true);
  assert.equal(sample.some((item) => item.id === "insights-landing"), false);
  assert.equal(sample.some((item) => item.name === "Marketing"), false);
  const site = templateChoices({ templates: quantumAgeTemplates });
  assert.equal(site.some((item) => item.name === "Blank canvas"), true);
  assert.equal(site.some((item) => item.id === "insights-landing"), true);
  assert.equal(site.some((item) => item.name === "Marketing"), true);
  const dialog = readFileSync("src/components/editor/dialogs.tsx", "utf8");
  assert.equal(dialog.includes("insights-landing"), false);
  assert.equal(dialog.includes("TEMPLATES"), false);
  const source = readFileSync("src/platform/templates/catalog.ts", "utf8").toLowerCase();
  assert.equal(source.includes("quantum"), false);
  assert.equal(source.includes("insights"), false);
  assert.equal(source.includes("plum"), false);
  const scan = spawnSync("rg", ["insights-landing", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
