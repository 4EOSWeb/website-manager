import { test } from "node:test";
import assert from "node:assert/strict";
import { validateFonts } from "../../src/platform/adapter/fonts.ts";

test("a sans file font passes and level 2 rejects an empty list", () => {
  const font = validateFonts(1, {
    fonts: [{ id: "body", family: "Example Sans", category: "sans", source: "file" }],
  });
  assert.equal(font.ok, true);
  const empty = validateFonts(2, { fonts: [] });
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.error.path, "fonts");
  assert.equal(validateFonts(1, { fonts: [] }).ok, true);
});
