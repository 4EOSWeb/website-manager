import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { assertMediaPreserved, missingMedia } from "../../src/platform/migrate/media-refs.ts";

test("a dropped media path fails and equal sets pass", () => {
  const before = { src: "/media/photo.png", shareImage: "/media/share.webp" };
  const after = { props: { src: "/media/photo.png" }, metadata: { shareImage: "/media/share.webp" } };
  assert.deepEqual(missingMedia(before, after), []);
  assert.equal(assertMediaPreserved(before, after).ok, true);

  const dropped = assertMediaPreserved(before, { props: { src: "/media/photo.png" } });
  assert.equal(dropped.ok, false);
  if (!dropped.ok) assert.equal(dropped.error.code, "migration_failed");
  assert.deepEqual(missingMedia(before, { props: { src: "/media/photo.png" } }), ["share.webp"]);
  assert.equal(fs.readFileSync("src/platform/migrate/media-refs.ts", "utf8").includes("fs."), false);
});
