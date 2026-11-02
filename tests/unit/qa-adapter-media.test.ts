import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mediaSchema } from "../../src/platform/adapter/media.ts";
import { quantumAgeMedia } from "../../adapters/quantum-age/media.ts";

test("quantum age media accepts the current image types", () => {
  assert.equal(mediaSchema.safeParse(quantumAgeMedia).success, true);
  assert.equal(quantumAgeMedia.storage, "git");
  assert.equal(quantumAgeMedia.publicDir, "public/media");
  const source = readFileSync(new URL("../../src/lib/media.ts", import.meta.url), "utf8");
  assert.match(source, /Use a PNG, JPEG, WebP, or SVG image\./);
  assert.deepEqual([...quantumAgeMedia.accept], [".png", ".jpg", ".jpeg", ".webp", ".svg"]);
});
