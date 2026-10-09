import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flexLayoutSchema } from "../../src/platform/document/layout-flex.ts";

test("a wrapping row parses", () => {
  const parsed = flexLayoutSchema.safeParse({
    mode: "layout",
    display: "flex",
    direction: "row",
    gap: 12,
    align: "center",
    justify: "between",
    wrap: true,
  });
  assert.equal(parsed.success, true);
  const source = readFileSync(new URL("../../src/platform/document/layout-flex.ts", import.meta.url), "utf8");
  assert.equal(/quantum|insights|harbor/i.test(source), false);
});
