import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { componentDefinitionSchema } from "../../src/platform/adapter/components.ts";
import { createRegistry } from "../../src/platform/registry/register.ts";
import { quantumAgeForm } from "../../adapters/quantum-age/components/form.ts";

test("the quantum age form keeps the recipient on the component", () => {
  assert.equal(componentDefinitionSchema.safeParse(quantumAgeForm).success, true);
  assert.equal(createRegistry().register(quantumAgeForm).ok, true);
  assert.equal(quantumAgeForm.defaultProps.recipient, "");
  assert.equal("recipient" in quantumAgeForm.defaultProps, true);
  const page = readFileSync(new URL("../../overlays/quantum-age/src/app/contact/page.tsx", import.meta.url), "utf8");
  assert.equal(page.includes("quantum-age.form"), false);
  const scan = spawnSync("rg", ["askQA@", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
