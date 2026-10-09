import { test } from "node:test";
import assert from "node:assert/strict";
import { commandsSchema } from "../../src/platform/adapter/commands.ts";

const commands = {
  packageManager: "pnpm" as const,
  install: "pnpm install",
  dev: "pnpm dev",
  build: "pnpm build",
  preview: "pnpm start",
};

test("pnpm commands pass and a newline fails", () => {
  assert.equal(commandsSchema.safeParse(commands).success, true);
  assert.equal(commandsSchema.safeParse({ ...commands, build: "pnpm build\nrm -rf ." }).success, false);
});
