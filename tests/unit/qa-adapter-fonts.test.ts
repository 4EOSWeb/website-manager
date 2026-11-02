import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { validateFonts } from "../../src/platform/adapter/fonts.ts";
import { quantumAgeFonts } from "../../adapters/quantum-age/fonts.ts";

test("quantum age fonts match the overlay layout", () => {
  const checked = validateFonts(2, quantumAgeFonts);
  assert.equal(checked.ok, true);
  if (!checked.ok) return;
  const byCategory = Object.fromEntries(checked.value.fonts.map((font) => [font.category, font.family]));
  assert.deepEqual(byCategory, { sans: "Figtree", serif: "Source Serif 4" });
  const layout = readFileSync(new URL("../../overlays/quantum-age/src/app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /import \{ Figtree, Source_Serif_4 \} from "next\/font\/google"/);
  const scan = spawnSync("rg", ["Figtree|Source Serif", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
