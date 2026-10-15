import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { componentDefinitionSchema } from "../../src/platform/adapter/components.ts";
import { createRegistry } from "../../src/platform/registry/register.ts";
import { quantumAgeHero, quantumAgeHeroLock, quantumAgeHeroProps } from "../../adapters/quantum-age/components/hero.ts";

test("the quantum age hero accepts current hero fields and keeps them out of the platform", () => {
  assert.equal(componentDefinitionSchema.safeParse(quantumAgeHero).success, true);
  assert.equal(createRegistry().register(quantumAgeHero).ok, true);
  assert.equal(quantumAgeHeroLock.defaultLocked, false);
  assert.equal(quantumAgeHeroProps.safeParse(quantumAgeHero.defaultProps).success, true);
  const current = quantumAgeHeroProps.safeParse({
    tagline: "Elevate strategy. Accelerate growth.",
    positioning: "The only marketing firm in senior care steeped in both consumer and business-to-business.",
    primaryButton: { label: "Start a conversation", href: "/contact" },
    heroImage: {
      src: "",
      alt: "",
      placement: "beside-mark",
      align: "start",
      width: "medium",
      aspect: "auto",
      focal: "center",
    },
  });
  assert.equal(current.success, true);
  const scan = spawnSync("rg", ["heroImage", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
