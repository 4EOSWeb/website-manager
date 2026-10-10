import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { templatesSchema } from "../../src/platform/adapter/templates.ts";
import { quantumAgeTemplates } from "../../adapters/quantum-age/templates.ts";

test("quantum age templates include insights-landing only outside the platform", () => {
  const parsed = templatesSchema.safeParse(quantumAgeTemplates);
  assert.equal(parsed.success, true);
  assert.deepEqual(
    quantumAgeTemplates.templates.map((item) => item.id),
    ["home", "marketing", "legal", "insights-landing"],
  );
  const dialog = readFileSync(new URL("../../src/components/editor/dialogs.tsx", import.meta.url), "utf8");
  assert.equal(dialog.includes("insights-landing"), true);
  assert.equal(dialog.includes("step 14.8"), true);
  const scan = spawnSync("rg", ["insights-landing", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
