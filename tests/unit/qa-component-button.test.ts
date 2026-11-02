import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { componentDefinitionSchema } from "../../src/platform/adapter/components.ts";
import { nodeTypes } from "../../src/platform/document/node-type.ts";
import { createRegistry } from "../../src/platform/registry/register.ts";
import { quantumAgeButton, quantumAgeButtonProps } from "../../adapters/quantum-age/components/button.ts";

test("the quantum age button validates and the platform button stays generic", () => {
  assert.equal(componentDefinitionSchema.safeParse(quantumAgeButton).success, true);
  assert.equal(createRegistry().register(quantumAgeButton).ok, true);
  assert.equal(quantumAgeButtonProps.safeParse(quantumAgeButton.defaultProps).success, true);
  assert.equal(nodeTypes.includes("button"), true);
  const source = readFileSync(new URL("../../src/platform/document/node-type.ts", import.meta.url), "utf8");
  assert.equal(source.includes("quantum-age"), false);
});
