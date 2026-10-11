import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyHistory, rememberScoped, undoScoped } from "../../src/lib/history.ts";

const before = { version: 1, pages: [{ id: "page_home", title: "Home" }] };
const edited = { version: 1, pages: [{ id: "page_home", title: "Edited" }] };

test("undo restores the previous visual document", () => {
  const history = rememberScoped(emptyHistory<{ text: string }>(), "web_quantum_age", { text: "Home" }, before);
  const undone = undoScoped(history, "web_quantum_age", { text: "Edited" }, edited);
  assert.ok(undone);
  assert.deepEqual(undone.visualDocument, before);
  assert.deepEqual(undone.value, { text: "Home" });
  assert.equal(history.past.length, 1);
});

test("undo does not cross websites", () => {
  const history = rememberScoped(emptyHistory<{ text: string }>(), "web_quantum_age", { text: "Home" }, before);
  const undone = undoScoped(history, "web_other", { text: "Edited" }, edited);
  assert.equal(undone, null);
  assert.equal(history.past.length, 1);
  assert.deepEqual(history.past[0]?.visualDocument, before);
});

test("a version 3 edit keeps a value snapshot without a visual document", () => {
  const history = rememberScoped(emptyHistory<{ text: string }>(), "web_quantum_age", { text: "Home" });
  const undone = undoScoped(history, "web_quantum_age", { text: "Edited" });
  assert.ok(undone);
  assert.equal(undone.value.text, "Home");
  assert.equal(undone.visualDocument, null);
});
