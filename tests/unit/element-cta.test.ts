import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCta } from "../../src/platform/elements/cta.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { serializeQuantumAge } from "../../adapters/quantum-age/serialize.ts";
import { fakeContext } from "./platform-helpers.ts";

function readProps(value: unknown) {
  if (!value || typeof value !== "object" || !("props" in value)) return {};
  const props = (value as { props?: unknown }).props;
  return props && typeof props === "object" ? props as Record<string, unknown> : {};
}

function node(id: string, type: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type,
    componentId: type,
    props: {} as Record<string, unknown>,
    styles: {},
    responsive: {},
    children: [] as Array<Record<string, unknown>>,
    visibility: { hidden: false, hideOn: [] as string[] },
    locked: { locked: false },
    metadata: {},
    ...extra,
  };
}

test("a call to action has three children and no site close copy", () => {
  const cta = createCta();
  assert.equal(nodeSchema.safeParse(cta).success, true);
  assert.equal(cta.children.length, 3);
  assert.deepEqual(cta.children.map((child) => child.type), ["heading", "text", "button"]);
  assert.equal(readProps(cta.children[2]).label, "Continue");
  assert.equal(readProps(cta.children[2]).href, "/");
  assert.equal(JSON.stringify(cta).toLowerCase().includes("insights"), false);
  const root = node("node_a10000000002", "section", { children: [cta] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const section = site.pages[0].sections[0];
  assert.equal(section.type, "cta");
  assert.equal(section.label, "Continue");
  assert.equal(section.href, "/");
  assert.equal(JSON.stringify(section).toLowerCase().includes("insights"), false);
  const source = readFileSync(new URL("../../src/platform/elements/cta.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
