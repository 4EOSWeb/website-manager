import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { themeSchema } from "../../src/platform/adapter/theme.ts";

test("open token names pass and duplicate ids fail", () => {
  const theme = themeSchema.safeParse({
    tokens: [
      { id: "sea", label: "Sea", kind: "color", value: "#114455" },
      { id: "sand", label: "Sand", kind: "color", value: "#e6d7c3" },
    ],
  });
  assert.equal(theme.success, true);
  const duplicate = themeSchema.safeParse({
    tokens: [
      { id: "sea", label: "Sea", kind: "color", value: "#114455" },
      { id: "sea", label: "Sea again", kind: "space", value: "16" },
    ],
  });
  assert.equal(duplicate.success, false);
  const source = readFileSync(new URL("../../src/platform/adapter/theme.ts", import.meta.url), "utf8");
  assert.equal(/plum|ink|green/.test(source), false);
});
