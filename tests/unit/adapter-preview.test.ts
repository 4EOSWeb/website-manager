import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { previewSchema } from "../../src/platform/adapter/preview.ts";

test("preview stays on the iframe protocol", () => {
  assert.equal(previewSchema.safeParse({
    transport: "iframe-postmessage",
    protocol: 1,
    readyEvent: "4eos-ready",
  }).success, true);
  assert.equal(previewSchema.safeParse({
    transport: "render-in-hub",
    protocol: 1,
    readyEvent: "4eos-ready",
  }).success, false);
  const source = readFileSync(new URL("../../src/platform/adapter/preview.ts", import.meta.url), "utf8");
  assert.equal(source.includes("The hub must not render site components."), true);
});
