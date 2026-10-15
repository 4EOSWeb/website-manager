import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sample from "../fixtures/adapters/sample/adapter.ts";
import quantumAgeAdapter from "../../adapters/quantum-age/adapter.ts";
import { createCustom, customCatalog } from "../../src/platform/elements/custom.ts";
import { insertAfter } from "../../src/platform/elements/create.ts";
import { createHeading } from "../../src/platform/elements/heading.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { blockForKind } from "../../src/lib/library.ts";

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

function readProps(value: unknown) {
  if (!value || typeof value !== "object" || !("props" in value)) return {};
  const props = (value as { props?: unknown }).props;
  return props && typeof props === "object" ? props as Record<string, unknown> : {};
}

const insightsId = "quantum-age.insights-summary";

test("the sample catalog hides site components and the active site catalog lists them", () => {
  const sampleIds = customCatalog(sample).map((item) => item.id);
  assert.equal(sampleIds.includes(insightsId), false);
  assert.deepEqual(sampleIds, []);

  const enabled = {
    ...sample,
    capabilities: { ...sample.capabilities, supportsCustomComponents: true },
  };
  assert.deepEqual(customCatalog(enabled).map((item) => item.id), []);

  const hidden = {
    capabilities: { supportsCustomComponents: false },
    components: {
      components: [
        {
          id: insightsId,
          name: "Insights summary",
          category: "content",
          thumbnail: "none",
          defaultProps: { heading: "", intro: "" },
          propsSchemaId: insightsId,
          inspector: "summary",
          acceptsChildren: false,
          allowedParents: ["section"],
          capabilities: {},
          locking: { locked: false },
          renderer: { exportName: "Summary" },
        },
      ],
    },
  };
  assert.deepEqual(customCatalog(hidden), []);

  const live = customCatalog(quantumAgeAdapter);
  const plain = customCatalog(JSON.parse(JSON.stringify(quantumAgeAdapter)));
  for (const catalog of [live, plain]) {
    assert.equal(catalog.some((item) => item.id === insightsId), true);
    assert.equal(catalog.some((item) => item.id === "quantum-age.button"), false);
    assert.equal(catalog.some((item) => item.id === "quantum-age.form"), false);
    assert.equal(catalog.some((item) => item.id === "quantum-age.logo"), false);
  }

  const source = readFileSync(new URL("../../src/platform/elements/custom.ts", import.meta.url), "utf8");
  const lowered = source.toLowerCase();
  for (const word of ["quantum", "insights", "heroimage", "tagline", "plum", "brand-mark"]) {
    assert.equal(lowered.includes(word), false, word);
  }
  const catalog = readFileSync(new URL("../../src/components/editor/library.tsx", import.meta.url), "utf8");
  assert.match(catalog, /customCatalog/);
  assert.match(catalog, /onCustom/);
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  assert.match(shell, /insertCreatedCustom/);
});

test("inserting a registered component uses its defaults and leaves the hero alone", () => {
  const definition = customCatalog(quantumAgeAdapter).find((item) => item.id === insightsId);
  assert.ok(definition);
  const created = createCustom(definition);
  assert.equal(nodeSchema.safeParse(created).success, true);
  assert.equal(created.type, "custom");
  assert.equal(created.componentId, insightsId);
  assert.deepEqual(created.props, { heading: "", intro: "" });
  assert.equal("heroImage" in created.props, false);
  assert.equal("tagline" in created.props, false);
  assert.match(created.id, /^node_[0-9a-f]{12}$/);

  const hero = node("node_hero0000001", "custom", {
    componentId: "quantum-age.hero",
    props: { tagline: "Elevate strategy. Accelerate growth.", heroImage: { src: "/media/hero.png" } },
  });
  const root = node("node_root0000001", "section", { children: [hero] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const next = insertAfter(document, "/", hero.id, created) as typeof document;
  const children = next.pages[0]?.root.children ?? [];
  assert.equal(children.length, 2);
  assert.deepEqual(readProps(children[0]), hero.props);
  assert.deepEqual(readProps(children[1]), { heading: "", intro: "" });
  assert.equal((children[1] as { componentId: string }).componentId, insightsId);
  assert.deepEqual(readProps(document.pages[0]?.root.children[0]), hero.props);

  assert.equal(createHeading().props.text, "Heading");
  assert.equal(blockForKind("button").kind, "button");
  assert.equal(blockForKind("image").kind, "image");
});
