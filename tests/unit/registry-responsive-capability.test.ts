import { test } from "node:test";
import assert from "node:assert/strict";
import { canOverrideBreakpoint } from "../../src/platform/registry/capabilities.ts";

const unlocked = { locked: { locked: false } };

test("only responsive unlocked components can add a breakpoint override", () => {
  assert.equal(canOverrideBreakpoint({ capabilities: { responsive: false } }, unlocked), false);
  assert.equal(canOverrideBreakpoint({ capabilities: { responsive: true } }, { locked: { locked: true } }), false);
  assert.equal(canOverrideBreakpoint({ capabilities: { responsive: true } }, unlocked), true);
});
