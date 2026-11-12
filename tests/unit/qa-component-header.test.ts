import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { componentDefinitionSchema } from "../../src/platform/adapter/components.ts";
import { createRegistry } from "../../src/platform/registry/register.ts";
import { canUnlock } from "../../src/platform/registry/locking.ts";
import { quantumAgeHeader, quantumAgeHeaderLock } from "../../adapters/quantum-age/components/header.ts";

test("the quantum age header definition validates and stays out of the platform", () => {
  assert.equal(componentDefinitionSchema.safeParse(quantumAgeHeader).success, true);
  const registry = createRegistry();
  const registered = registry.register(quantumAgeHeader);
  assert.equal(registered.ok, true);
  assert.equal(quantumAgeHeader.capabilities.draggable, false);
  assert.equal(quantumAgeHeader.acceptsChildren, false);
  assert.equal(quantumAgeHeader.locking.locked, true);
  assert.deepEqual(Object.keys(quantumAgeHeader.defaultProps), ["logo", "siteName", "buttonLabel", "buttonHref", "sticky"]);
  assert.equal(quantumAgeHeader.renderer.exportName, "SiteHeader");
  assert.equal(quantumAgeHeaderLock.defaultLocked, true);
  assert.equal(canUnlock(quantumAgeHeaderLock, "administrator"), true);
  assert.equal(canUnlock(quantumAgeHeaderLock, "editor"), false);
  const source = readFileSync(new URL("../../adapters/quantum-age/components/header.ts", import.meta.url), "utf8");
  assert.equal(source.includes("site-header"), false);
  const scan = spawnSync("rg", ["site-header", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
