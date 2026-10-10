import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { staticRoutesSchema } from "../../src/platform/adapter/routes.ts";
import { quantumAgeRoutes } from "../../adapters/quantum-age/routes.ts";

const required = ["/", "/about", "/approach", "/solutions", "/team", "/references", "/insights", "/contact", "/privacy", "/terms"];

test("quantum age routes match the editor config and stay out of the platform", () => {
  const config = JSON.parse(readFileSync(new URL("../../overlays/quantum-age/4eos.editor.config.json", import.meta.url), "utf8")) as {
    routes: { path: string; title: string; editable?: boolean }[];
  };
  const expected = config.routes.map(({ path, title }) => ({ path, title }));
  assert.equal(staticRoutesSchema.safeParse(quantumAgeRoutes).success, true);
  assert.deepEqual(quantumAgeRoutes, expected);
  for (const path of required) assert.equal(quantumAgeRoutes.some((route) => route.path === path), true);
  assert.equal(quantumAgeRoutes.some((route) => "editable" in route), false);
  const scan = spawnSync("rg", ["-n", "/about|/approach|/solutions|/team|/references|/insights|/contact|/privacy|/terms", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
