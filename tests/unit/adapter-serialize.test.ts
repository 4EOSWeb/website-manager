import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { serialize, writtenFiles } from "../../src/platform/adapter/serialize.ts";
import { fakeContext } from "./platform-helpers.ts";
import { stackedPage } from "./fixtures/stacked-page.ts";

test("the default serializer writes version 1 and rejects parent paths", () => {
  const written = serialize(stackedPage, fakeContext("sample"));
  assert.equal(written.ok, true);
  if (written.ok) {
    assert.equal(written.value.length, 1);
    assert.equal(written.value[0]?.path, "src/content/editor/document.json");
    assert.equal(JSON.parse(written.value[0]?.contents ?? "{}").version, 1);
  }
  const escaped = writtenFiles([{ path: "../secrets", contents: "{}" }]);
  assert.equal(escaped.ok, false);
  if (!escaped.ok) assert.equal(escaped.error.path, "path");
  const publish = readFileSync(new URL("../../src/lib/publish.ts", import.meta.url), "utf8");
  assert.equal(publish.includes("adapter/serialize"), false);
  assert.equal(publish.includes("document.json"), false);
});
