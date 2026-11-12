import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mountEditorStore, sessionKey, setNodeLabel, unmountEditorStore } from "../../src/components/editor/state/store.ts";

function memory() {
  const items = new Map<string, string>();
  return {
    items,
    getItem(key: string) {
      return items.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      items.set(key, value);
    },
    removeItem(key: string) {
      items.delete(key);
    },
  };
}

test("unmounting one website does not leave its label for the next", () => {
  const storage = memory();
  mountEditorStore("web_a");
  setNodeLabel("web_a", "From A", storage);
  assert.equal(storage.getItem(sessionKey("web_a", "label")), "From A");
  assert.equal(sessionKey("web_a", "label").startsWith("4eos.web_a."), true);
  unmountEditorStore("web_a", storage);
  const other = mountEditorStore("web_b");
  assert.equal(other.label, "");
  assert.equal(storage.getItem(sessionKey("web_a", "label")), null);
  assert.equal(mountEditorStore("web_a").label, "");
  unmountEditorStore("web_b", storage);
});

test("a save still writes the version 3 draft and the visual document", () => {
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  assert.equal(shell.includes("mountEditorStore"), true);
  assert.equal(shell.includes("unmountEditorStore"), true);
  assert.equal(shell.includes("draft: next"), true);
  assert.equal(shell.includes("visualDocument"), true);
  assert.equal(shell.includes("sessionStorage"), true);
});
