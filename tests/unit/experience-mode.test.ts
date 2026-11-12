import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canUseAdministrator, experienceKey, persistExperience, readExperience } from "../../src/components/editor/state/experience.ts";

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
  };
}

test("experience mode defaults to basic and is stored per website", () => {
  const storage = memory();
  assert.equal(readExperience(storage, "web_quantum_age", true), "basic");
  assert.equal(experienceKey("web_quantum_age"), "4eos.experience.web_quantum_age");
  assert.equal(persistExperience(storage, "web_quantum_age", "advanced", false), "advanced");
  assert.equal(storage.items.get("4eos.experience.web_quantum_age"), "advanced");
  assert.equal(storage.items.has("4eos.experience.web_other"), false);
});

test("only a super administrator or client administrator can persist administrator", () => {
  assert.equal(canUseAdministrator("SUPER_ADMIN", null), true);
  assert.equal(canUseAdministrator("SUPER_ADMIN", "CLIENT_EDITOR"), true);
  assert.equal(canUseAdministrator(null, "CLIENT_ADMIN"), true);
  assert.equal(canUseAdministrator("DESIGNER", null), false);
  assert.equal(canUseAdministrator(null, "CLIENT_EDITOR"), false);
  assert.equal(canUseAdministrator(null, "VIEWER"), false);

  const admin = memory();
  assert.equal(persistExperience(admin, "web_quantum_age", "administrator", canUseAdministrator("SUPER_ADMIN", null)), "administrator");
  assert.equal(admin.items.get(experienceKey("web_quantum_age")), "administrator");

  const clientAdmin = memory();
  assert.equal(persistExperience(clientAdmin, "web_quantum_age", "administrator", canUseAdministrator(null, "CLIENT_ADMIN")), "administrator");

  const editor = memory();
  editor.items.set(experienceKey("web_quantum_age"), "advanced");
  assert.equal(persistExperience(editor, "web_quantum_age", "administrator", canUseAdministrator(null, "CLIENT_EDITOR")), "advanced");
  assert.equal(editor.items.get(experienceKey("web_quantum_age")), "advanced");

  const stored = memory();
  stored.items.set(experienceKey("web_quantum_age"), "administrator");
  assert.equal(readExperience(stored, "web_quantum_age", canUseAdministrator(null, "CLIENT_EDITOR")), "basic");
  assert.equal(stored.items.get(experienceKey("web_quantum_age")), "administrator");
});

test("the account menu offers the modes and the inspector tabs stay", () => {
  const page = readFileSync(new URL("../../src/app/sites/[websiteId]/editor/page.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  const chrome = readFileSync(new URL("../../src/components/editor/chrome.tsx", import.meta.url), "utf8");
  const inspector = readFileSync(new URL("../../src/components/editor/inspector/index.tsx", import.meta.url), "utf8");
  assert.equal(page.includes("canUseAdministrator"), true);
  assert.equal(shell.includes("readExperience"), true);
  assert.equal(shell.includes("persistExperience"), true);
  assert.equal(chrome.includes("Basic"), true);
  assert.equal(chrome.includes("Advanced"), true);
  assert.equal(chrome.includes("Administrator"), true);
  assert.equal(inspector.includes('{ id: "content", label: "Content" }'), true);
  assert.equal(inspector.includes('{ id: "design", label: "Design" }'), true);
  assert.equal(inspector.includes('{ id: "layout", label: "Layout" }'), true);
});
