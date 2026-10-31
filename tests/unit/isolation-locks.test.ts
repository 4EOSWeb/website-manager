import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { createElement } from "../../src/platform/elements/create.ts";
import { createParagraph } from "../../src/platform/elements/paragraph.ts";
import { lockVisualNode } from "../../src/components/editor/layers/lock-node.ts";
import { registryFromAdapter } from "../../src/platform/registry/discover.ts";

function lockFlags(value: unknown): string[] {
  const flags: string[] = [];
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const record = node as { id?: unknown; locked?: unknown; children?: unknown; pages?: unknown; root?: unknown };
    if (typeof record.id === "string") flags.push(`${record.id}:${JSON.stringify(record.locked ?? null)}`);
    if (record.root) walk(record.root);
    if (Array.isArray(record.pages)) for (const page of record.pages) walk(page);
    if (Array.isArray(record.children)) for (const child of record.children) walk(child);
  }
  walk(value);
  return flags;
}

function findLocked(value: unknown, id: string): boolean | null {
  if (!value || typeof value !== "object") return null;
  const record = value as { id?: unknown; locked?: { locked?: boolean }; children?: unknown; pages?: unknown; root?: unknown };
  if (record.id === id) return record.locked?.locked === true;
  for (const child of [record.root, ...(Array.isArray(record.pages) ? record.pages : []), ...(Array.isArray(record.children) ? record.children : [])]) {
    const found = findLocked(child, id);
    if (found !== null) return found;
  }
  return null;
}

test("locking a Harbor paragraph does not change Quantum Age locks", () => {
  const harbor = registryFromAdapter(harborAdapter);
  const quantum = registryFromAdapter(quantumAgeAdapter);
  assert.equal(harbor.ok, true);
  assert.equal(quantum.ok, true);
  if (!harbor.ok || !quantum.ok) return;
  assert.equal(harbor.value.get("quantum-age.logo"), undefined);
  assert.equal(quantum.value.get("quantum-age.logo")?.locking.locked, true);

  const paragraph = createParagraph();
  const root = createElement("section", "generic.section", {});
  root.children = [paragraph];
  const harborDocument = {
    version: 1,
    pages: [{ id: "page_harbor_lock", route: "/", title: "Home", metadata: {}, root }],
  };
  const quantumParagraph = createParagraph();
  const quantumRoot = createElement("section", "generic.section", {});
  quantumRoot.children = [quantumParagraph];
  const quantumDocument = {
    version: 1,
    pages: [{ id: "page_quantum_lock", route: "/", title: "Home", metadata: {}, root: quantumRoot }],
  };
  const before = lockFlags(quantumDocument);
  const locked = lockVisualNode(structuredClone(harborDocument), paragraph.id);
  assert.ok(locked);
  assert.equal(findLocked(locked, paragraph.id), true);
  assert.deepEqual(lockFlags(quantumDocument), before);
  assert.equal(findLocked(quantumDocument, quantumParagraph.id), false);
  assert.equal(findLocked(locked, quantumParagraph.id), null);
});
