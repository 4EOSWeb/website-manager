import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { breakpointsSchema } from "../../src/platform/adapter/breakpoints.ts";

const widths = [
  { id: "desktop", width: 1200, label: "Desktop" },
  { id: "tablet", width: 800, label: "Tablet" },
  { id: "mobile", width: 360, label: "Phone" },
];

test("breakpoints require mobile and a width of at least 320", () => {
  assert.equal(breakpointsSchema.safeParse({ breakpoints: widths }).success, true);
  assert.equal(breakpointsSchema.safeParse({
    breakpoints: widths.filter((item) => item.id !== "mobile").concat([{ id: "desktop", width: 1100, label: "Wide" }]),
  }).success, false);
  assert.equal(breakpointsSchema.safeParse({
    breakpoints: widths.map((item) => item.id === "mobile" ? { ...item, width: 200 } : item),
  }).success, false);
  const source = readFileSync(new URL("../../src/platform/adapter/breakpoints.ts", import.meta.url), "utf8");
  assert.equal(source.includes("390"), false);
  assert.equal(source.includes("768"), false);
  assert.equal(source.includes("1280"), false);
});
