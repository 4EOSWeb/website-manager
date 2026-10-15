import { test } from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

test("the preview script compiles and inlines every helper", async () => {
  const { canvasRuntimeScript } = (await jiti.import("../../src/platform/canvas/runtime.ts")) as {
    canvasRuntimeScript: (origin: string) => string;
  };
  const script = canvasRuntimeScript("http://127.0.0.1:3210");
  assert.doesNotThrow(() => new Function(script));
  for (const name of ["pressIntent", "passedThreshold", "sectionDropIndex", "insertionIndex", "snapBox", "placeToolbar", "toggleMark", "marksToHtml", "validLink"]) {
    assert.match(script, new RegExp(`${name}: \\(`));
  }
  assert.ok(!script.includes("</script"), "the script must not close its own tag");
  assert.equal(script.includes("4eos-reorder-block"), false);
  assert.match(script, /closest\("\.eos-bar"\)/);
  const { readFileSync } = await import("node:fs");
  const loader = readFileSync(new URL("../../overlays/quantum-age/src/components/site/canvas-script.ts", import.meta.url), "utf8");
  assert.equal(loader.includes("canvasRuntimeScript"), true);
  assert.equal(loader.includes("4eos-reorder-block"), false);
});
