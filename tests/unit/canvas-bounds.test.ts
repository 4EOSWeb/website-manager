import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parentBounds } from "../../src/platform/canvas/bounds.ts";

function element(clientWidth: number, clientHeight: number, padding: { top: string; right: string; bottom: string; left: string }, extra: Record<string, number> = {}) {
  return {
    clientWidth,
    clientHeight,
    ...extra,
    ownerDocument: {
      defaultView: {
        getComputedStyle: () => ({
          paddingTop: padding.top,
          paddingRight: padding.right,
          paddingBottom: padding.bottom,
          paddingLeft: padding.left,
        }),
      },
    },
  };
}

test("parent bounds are the content box, not the viewport", () => {
  const padded = element(400, 220, { top: "16px", right: "24px", bottom: "16px", left: "24px" }, { innerWidth: 1440, innerHeight: 900 });
  assert.deepEqual(parentBounds(padded), { width: 352, height: 188 });
  const flush = element(1184, 352, { top: "0px", right: "0px", bottom: "0px", left: "0px" });
  assert.deepEqual(parentBounds(flush), { width: 1184, height: 352 });
  const tight = element(20, 10, { top: "12px", right: "12px", bottom: "12px", left: "12px" });
  assert.deepEqual(parentBounds(tight), { width: 0, height: 0 });
  const source = readFileSync(new URL("../../src/platform/canvas/bounds.ts", import.meta.url), "utf8");
  assert.equal(source.includes("innerWidth"), false);
  assert.equal(source.includes("overlays/"), false);
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.toLowerCase().includes(word), false, word);
  }
});

test("the runtime copy leaves the preview script in place", () => {
  const script = readFileSync(new URL("../../scripts/sync-canvas-runtime.ts", import.meta.url), "utf8");
  assert.equal(script.includes("\"src\", \"platform\", \"canvas\""), true);
  assert.equal(script.includes("unlink"), false);
  assert.equal(script.includes("rmSync"), false);
  assert.equal(script.includes("overlays/"), false);
  const run = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "scripts/sync-canvas-runtime.ts", "web_quantum_age"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  const copied = readFileSync(".workspaces/web_quantum_age/src/platform/canvas/bounds.ts", "utf8");
  const original = readFileSync("src/platform/canvas/bounds.ts", "utf8");
  assert.equal(copied, original);
  assert.equal(existsSync(".workspaces/web_quantum_age/src/components/site/canvas-script.ts"), true);
});
