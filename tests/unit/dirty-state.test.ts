import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emptyDirty, markChanged, markSaved, shouldWarnBeforeUnload, switchWebsite } from "../../src/components/editor/state/dirty.ts";

test("a visual or version 3 change is dirty until save", () => {
  const visual = markChanged(emptyDirty("web_quantum_age"), { visualDocument: { version: 1, pages: [] } });
  assert.equal(visual.dirty, true);
  assert.equal(shouldWarnBeforeUnload(visual), true);
  assert.equal(markSaved(visual).dirty, false);
  assert.equal(shouldWarnBeforeUnload(markSaved(visual)), false);

  const version3 = markChanged(emptyDirty("web_quantum_age"), { version3: { version: 3, pages: [] } });
  assert.equal(version3.dirty, true);
  assert.deepEqual(version3.document?.version3, { version: 3, pages: [] });
});

test("switching website drops the dirty document", () => {
  const dirty = markChanged(emptyDirty("web_quantum_age"), {
    version3: { version: 3, title: "Home" },
    visualDocument: { version: 1, pages: [{ id: "page_home" }] },
  });
  const moved = switchWebsite(dirty, "web_other");
  assert.equal(moved.warn, true);
  assert.equal(moved.savedToNext, null);
  assert.equal(moved.state.websiteId, "web_other");
  assert.equal(moved.state.dirty, false);
  assert.equal(moved.state.document, null);
  assert.equal(switchWebsite(moved.state, "web_other").warn, false);
});

test("the editor still warns before unload", () => {
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  assert.equal(shell.includes("beforeunload"), true);
  assert.equal(shell.includes("switchWebsite"), true);
  assert.equal(shell.includes("markChanged"), true);
  assert.equal(shell.includes("markSaved"), true);
});
