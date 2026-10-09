import { test } from "node:test";
import assert from "node:assert/strict";
import { mediaSchema } from "../../src/platform/adapter/media.ts";

test("media dirs stay relative and only image extensions are accepted", () => {
  assert.equal(mediaSchema.safeParse({
    storage: "git",
    publicDir: "public/media",
    accept: [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"],
  }).success, true);
  assert.equal(mediaSchema.safeParse({
    storage: "external",
    publicDir: "public/../secrets",
    accept: [".png"],
  }).success, false);
  assert.equal(mediaSchema.safeParse({
    storage: "git",
    publicDir: "public/media",
    accept: [".exe"],
  }).success, false);
});
