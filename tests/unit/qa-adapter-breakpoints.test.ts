import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { breakpointsSchema } from "../../src/platform/adapter/breakpoints.ts";
import { quantumAgeBreakpoints } from "../../adapters/quantum-age/breakpoints.ts";

test("quantum age breakpoint widths match the editor config", () => {
  const config = JSON.parse(readFileSync(new URL("../../overlays/quantum-age/4eos.editor.config.json", import.meta.url), "utf8")) as {
    viewports: { id: string; width: number }[];
  };
  const parsed = breakpointsSchema.safeParse(quantumAgeBreakpoints);
  assert.equal(parsed.success, true);
  const widths = Object.fromEntries(quantumAgeBreakpoints.breakpoints.map((item) => [item.id, item.width]));
  assert.deepEqual(widths, Object.fromEntries(config.viewports.map((item) => [item.id, item.width])));
  assert.deepEqual(
    quantumAgeBreakpoints.breakpoints.map((item) => item.label),
    ["Desktop", "Tablet", "Mobile"],
  );
  const radios = readFileSync(new URL("../../src/components/editor/types.ts", import.meta.url), "utf8");
  assert.match(radios, /label: "Phone", width: 390/);
  assert.match(radios, /label: "Desktop", width: 1280/);
  assert.match(radios, /label: "Tablet", width: 768/);
});
