import { test } from "node:test";
import assert from "node:assert/strict";
import { canRedoScoped, emptyHistory, redoScoped, rememberScoped, undoScoped, type ScopedSnapshot } from "../../src/lib/history.ts";

const before = { version: 1, pages: [{ id: "page_home", title: "Home" }] };
const edited = { version: 1, pages: [{ id: "page_home", title: "Edited" }] };

test("undo restores the previous visual document", () => {
  const history = rememberScoped(emptyHistory<ScopedSnapshot<{ text: string }>>(), "web_quantum_age", { text: "Home" }, before);
  const undone = undoScoped(history, "web_quantum_age", { text: "Edited" }, edited);
  assert.ok(undone);
  assert.deepEqual(undone.visualDocument, before);
  assert.deepEqual(undone.value, { text: "Home" });
  assert.equal(history.past.length, 1);
});

test("undo does not cross websites", () => {
  const history = rememberScoped(emptyHistory<ScopedSnapshot<{ text: string }>>(), "web_quantum_age", { text: "Home" }, before);
  const undone = undoScoped(history, "web_other", { text: "Edited" }, edited);
  assert.equal(undone, null);
  assert.equal(history.past.length, 1);
  assert.deepEqual(history.past[0]?.visualDocument, before);
});

test("redo returns the edited visual document and a new edit drops it", () => {
  const history = rememberScoped(emptyHistory<ScopedSnapshot<{ text: string }>>(), "web_quantum_age", { text: "Home" }, before);
  const undone = undoScoped(history, "web_quantum_age", { text: "Edited" }, edited);
  assert.ok(undone);
  assert.equal(canRedoScoped(undone.history, "web_quantum_age"), true);
  assert.equal(canRedoScoped(undone.history, "web_other"), false);
  const redone = redoScoped(undone.history, "web_quantum_age", { text: "Home" }, before);
  assert.ok(redone);
  assert.deepEqual(redone.visualDocument, edited);
  assert.deepEqual(redone.value, { text: "Edited" });
  assert.equal(canRedoScoped(redone.history, "web_quantum_age"), false);
  assert.equal(redoScoped(redone.history, "web_quantum_age", { text: "Edited" }, edited), null);
  const cleared = rememberScoped(undone.history, "web_quantum_age", { text: "Home" }, { version: 1, pages: [{ id: "page_home", title: "Fresh" }] });
  assert.deepEqual(cleared.future, []);
  assert.equal(canRedoScoped(cleared, "web_quantum_age"), false);
});

test("a version 3 edit keeps a value snapshot without a visual document", () => {
  const history = rememberScoped(emptyHistory<ScopedSnapshot<{ text: string }>>(), "web_quantum_age", { text: "Home" });
  const undone = undoScoped(history, "web_quantum_age", { text: "Edited" });
  assert.ok(undone);
  assert.equal(undone.value.text, "Home");
  assert.equal(undone.visualDocument, null);
});
