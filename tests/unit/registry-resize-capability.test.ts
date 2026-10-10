import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canResize } from "../../src/platform/registry/capabilities.ts";

const unlocked = { locked: { locked: false } };

test("resize requires a resizable unlocked component on a canvas parent", () => {
  const resizable = { capabilities: { resizable: true } };
  assert.equal(canResize({ capabilities: { resizable: false } }, unlocked, { mode: "canvas" }), false);
  assert.equal(canResize(resizable, unlocked, { mode: "flow" }), false);
  assert.equal(canResize(resizable, { locked: { locked: true } }, { mode: "canvas" }), false);
  assert.equal(canResize(resizable, unlocked, { mode: "canvas" }), true);
  const source = readFileSync(new URL("../../src/platform/registry/capabilities.ts", import.meta.url), "utf8");
  assert.equal(source.includes("createElement"), false);
  const script = readFileSync(new URL("../../overlays/quantum-age/src/components/site/canvas-script.ts", import.meta.url), "utf8");
  assert.equal(script.includes('drag.kind === "resize"'), true);
});
