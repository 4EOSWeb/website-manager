import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { containerAcceptsChildren, createContainer } from "../../src/platform/elements/container.ts";
import { insertNode } from "../../src/platform/elements/create.ts";
import { createHeading } from "../../src/platform/elements/heading.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { serializeQuantumAge } from "../../adapters/quantum-age/serialize.ts";
import { fakeContext } from "./platform-helpers.ts";

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

test("a container starts empty and can hold a heading", () => {
  const container = createContainer();
  assert.equal(containerAcceptsChildren, true);
  assert.equal(nodeSchema.safeParse(container).success, true);
  assert.equal(container.type, "container");
  assert.deepEqual(container.children, []);
  assert.deepEqual(container.layout, { mode: "flow", direction: "vertical", gap: 0 });
  const heading = createHeading();
  const root = node("node_a10000000002", "section", { children: [container] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const next = insertNode(document, "/", container.id, heading) as typeof document;
  const parent = next.pages[0]?.root.children[0] as { children?: Array<{ id?: string }> } | undefined;
  assert.equal(parent?.children?.length, 1);
  assert.equal(parent?.children?.[0]?.id, heading.id);
  const result = serializeQuantumAge(next, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const flows = site.pages[0].sections.filter((section: { type: string }) => section.type === "flow");
  assert.equal(flows.length, 1);
  assert.equal(flows[0].editorName, "Container");
  assert.equal(flows[0].blocks[0].text.text, "Heading");
  const source = readFileSync(new URL("../../src/platform/elements/container.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
