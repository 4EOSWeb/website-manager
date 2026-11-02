import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveScale } from "../../src/platform/document/strategy.ts";

test("scale returns the same percentages and does not read the viewport", () => {
  const box = { x: 12, y: 34, w: 56, h: 78 };
  assert.deepEqual(resolveScale(box), box);
  const source = readFileSync(new URL("../../src/platform/document/strategy.ts", import.meta.url), "utf8");
  assert.equal(/innerWidth|innerHeight|visualViewport|matchMedia|clientWidth|clientHeight|window/.test(source), false);
});
