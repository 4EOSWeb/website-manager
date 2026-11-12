import { test } from "node:test";
import assert from "node:assert/strict";
import { detectCommands } from "../../src/platform/onboarding/detect-commands.ts";

test("dev and build scripts fill those fields", () => {
  const suggested = detectCommands({
    scripts: { dev: "next dev", build: "next build" },
  });
  assert.equal(suggested.dev.value, "next dev");
  assert.equal(suggested.dev.required, false);
  assert.equal(suggested.build.value, "next build");
  assert.equal(suggested.build.required, false);
  assert.equal(suggested.preview.value, "");
  assert.equal(suggested.preview.required, true);
});

test("missing scripts stay empty and required", () => {
  const suggested = detectCommands({ scripts: {} });
  assert.deepEqual(suggested, {
    dev: { value: "", required: true },
    build: { value: "", required: true },
    preview: { value: "", required: true },
  });
});
