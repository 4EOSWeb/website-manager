import { test } from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

test("the preview script compiles and inlines every helper", async () => {
  const { canvasScript } = (await jiti.import("../../overlays/quantum-age/src/components/site/canvas-script.ts")) as {
    canvasScript: (origin: string) => string;
  };
  const script = canvasScript("http://127.0.0.1:3210");
  assert.doesNotThrow(() => new Function(script));
  for (const name of ["pressIntent", "passedThreshold", "sectionDropIndex", "insertionIndex", "snapBox", "placeToolbar", "toggleMark", "marksToHtml", "validLink"]) {
    assert.match(script, new RegExp(`${name}: \\(`));
  }
  assert.ok(!script.includes("</script"), "the script must not close its own tag");
});
