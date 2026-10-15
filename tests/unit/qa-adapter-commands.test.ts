import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { commandsSchema } from "../../src/platform/adapter/commands.ts";
import { quantumAgeCommands } from "../../adapters/quantum-age/commands.ts";

test("quantum age commands match the editor config", () => {
  const config = JSON.parse(readFileSync(new URL("../../overlays/quantum-age/4eos.editor.config.json", import.meta.url), "utf8")) as {
    packageManager: string;
    installCommand: string;
    devCommand: string;
    buildCommand: string;
  };
  const hub = readFileSync(new URL("../../src/lib/workspace.ts", import.meta.url), "utf8");
  assert.equal(commandsSchema.safeParse(quantumAgeCommands).success, true);
  assert.equal(quantumAgeCommands.packageManager, config.packageManager);
  assert.equal(quantumAgeCommands.install, config.installCommand);
  assert.equal(quantumAgeCommands.dev, config.devCommand);
  assert.equal(quantumAgeCommands.build, config.buildCommand);
  assert.equal(quantumAgeCommands.preview, config.devCommand);
  assert.equal(hub.includes('spawn("npm", ["run", "dev"'), true);
  const scan = spawnSync("rg", ["-n", "npm ci", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
