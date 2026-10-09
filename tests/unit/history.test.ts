import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyHistory, redoStep, remember, undoStep } from "../../src/lib/history.ts";

test("undo returns the state before the change, and redo brings the change back", () => {
  const history = remember(emptyHistory<string>(), "a");
  const undone = undoStep(history, "b");
  assert.ok(undone);
  assert.equal(undone.state, "a");
  const redone = redoStep(undone.history, "a");
  assert.ok(redone);
  assert.equal(redone.state, "b");
  assert.deepEqual(redone.history, { past: ["a"], future: [] });
});

test("a new change drops the redo steps", () => {
  const undone = undoStep(remember(emptyHistory<string>(), "a"), "b");
  assert.ok(undone);
  assert.deepEqual(remember(undone.history, "a").future, []);
});

test("nothing to undo or redo returns null", () => {
  assert.equal(undoStep(emptyHistory<string>(), "a"), null);
  assert.equal(redoStep(emptyHistory<string>(), "a"), null);
});

test("history keeps only the newest steps", () => {
  let history = emptyHistory<number>();
  for (let step = 0; step < 10; step += 1) history = remember(history, step, 4);
  assert.deepEqual(history.past, [6, 7, 8, 9]);
});
