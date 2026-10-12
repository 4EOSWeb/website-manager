import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHeading } from "../../src/platform/elements/heading.ts";
import { insertNode, nodeIdsIn } from "../../src/platform/elements/create.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { serializeQuantumAge } from "../../adapters/quantum-age/serialize.ts";
import { emptyHistory, rememberScoped, undoScoped, type ScopedSnapshot } from "../../src/lib/history.ts";
import { insertFlowBlock } from "../../src/lib/editor-ops.ts";
import type { SiteDraft } from "../../src/lib/content-schema.ts";
import { fakeContext } from "./platform-helpers.ts";

function node(id: string, type: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type,
    componentId: type,
    props: {},
    styles: {},
    responsive: {},
    children: [] as Array<Record<string, unknown>>,
    visibility: { hidden: false, hideOn: [] as string[] },
    locked: { locked: false },
    metadata: {},
    ...extra,
  };
}

const heroProps = {
  tagline: "Elevate strategy. Accelerate growth.",
  positioning: "The only marketing firm in senior care steeped in both consumer and business-to-business.",
  primaryButton: { label: "Talk with us", href: "/contact" },
  heroImage: {
    src: "/media/hero.png",
    alt: "Office",
    placement: "with-copy",
    align: "start",
    width: "medium",
    aspect: "auto",
    focal: "center",
  },
};

test("a heading node is new, unlocked, and uses the text Heading", () => {
  const first = createHeading();
  const second = createHeading();
  const parsed = nodeSchema.safeParse(first);
  assert.equal(parsed.success, true);
  assert.equal(first.type, "heading");
  assert.equal(first.componentId, "generic.heading");
  assert.equal(first.props.text, "Heading");
  assert.equal(first.props.level, 2);
  assert.deepEqual(first.styles, {});
  assert.equal(first.locked.locked, false);
  assert.match(first.id, /^node_[0-9a-f]{12}$/);
  assert.equal(first.id.startsWith("blk_"), false);
  assert.notEqual(first.id, second.id);
  assert.equal(["blk_who_h", "blk_home"].includes(first.id), false);
  const platform = ["src/platform/elements/heading.ts", "src/platform/elements/create.ts"]
    .map((path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8").toLowerCase())
    .join("\n");
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(platform.includes(word), false, word);
  }
  const catalog = readFileSync(new URL("../../src/components/editor/library.tsx", import.meta.url), "utf8");
  assert.match(catalog, /createHeading\(\)/);
  assert.match(catalog, /id: "element:heading"/);
  assert.match(catalog, /category: "Text"/);
});

test("the heading is inserted into the selected container or the page root", () => {
  const existing = node("node_cccccccccccc", "heading", { componentId: "heading", props: { text: "Keep this title", level: 2 } });
  const container = node("node_bbbbbbbbbbbb", "container");
  const root = node("node_aaaaaaaaaaaa", "section", { children: [existing, container] });
  const document = {
    version: 1,
    pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }],
  };
  const intoContainer = createHeading();
  const nested = insertNode(document, "/", "node_bbbbbbbbbbbb", intoContainer) as typeof document;
  const nestedRoot = nested.pages[0]?.root;
  const nestedContainer = nestedRoot?.children[1] as { children: Array<{ id: string }> };
  assert.equal(nestedContainer?.children[0]?.id, intoContainer.id);
  assert.equal(nestedRoot?.children.length, 2);
  assert.equal((nestedRoot?.children[0] as { props: { text: string } }).props.text, "Keep this title");
  assert.equal(document.pages[0]?.root.children.length, 2);

  const ontoRoot = createHeading();
  const rooted = insertNode(document, "/", existing.id, ontoRoot) as typeof document;
  const ids = rooted.pages[0]?.root.children.map((child) => child.id);
  assert.deepEqual(ids, [existing.id, container.id, ontoRoot.id]);

  const locked = node("node_dddddddddddd", "section", { locked: { locked: true } });
  const blocked = insertNode(
    { version: 1, pages: [{ id: "page_dddddddddddd", route: "/privacy", title: "Privacy", metadata: {}, root: locked }] },
    "/privacy",
    null,
    createHeading(),
  );
  assert.equal(blocked, null);
});

test("undo removes only the new heading node", () => {
  const existing = node("node_cccccccccccc", "heading", { componentId: "heading", props: { text: "Keep this title", level: 2 } });
  const root = node("node_aaaaaaaaaaaa", "section", { children: [existing] });
  const before = {
    version: 1,
    pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }],
  };
  const added = createHeading();
  const after = insertNode(structuredClone(before), "/", null, added);
  assert.equal(nodeIdsIn(after).includes(added.id), true);
  assert.equal(nodeIdsIn(before).includes(added.id), false);
  const history = rememberScoped(emptyHistory<ScopedSnapshot<typeof before>>(), "web_quantum_age", before, before);
  const undone = undoScoped(history, "web_quantum_age", after, after);
  assert.ok(undone);
  assert.deepEqual(undone.visualDocument, before);
  assert.equal(nodeIdsIn(undone.visualDocument).includes(added.id), false);
  const restored = undone.visualDocument as typeof before;
  const child = restored.pages[0]?.root.children[0];
  const props = child?.props;
  assert.equal(props && typeof props === "object" && "text" in props ? props.text : "", "Keep this title");
});

test("serializing a heading maps a flow block and leaves hero fields unchanged", () => {
  const hero = node("node_a10000000002", "custom", { componentId: "quantum-age.hero", props: heroProps });
  const existing = node("node_a10000000004", "heading", { componentId: "heading", props: { text: "Keep this title", level: 2 } });
  const heading = createHeading();
  const root = node("node_a10000000001", "section", { children: [hero, existing, heading] });
  const document = {
    version: 1,
    pages: [{ id: "page_a10000000001", route: "/", title: "Home", metadata: {}, root }],
  };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const home = JSON.parse(String(result.value.find((file) => file.path === "src/content/pages/home.json")?.contents));
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  assert.deepEqual(home, heroProps);
  assert.equal(home.heroImage.src, "/media/hero.png");
  assert.equal(home.tagline, heroProps.tagline);
  const section = site.pages[0].sections[0];
  assert.equal(section.type, "flow");
  assert.equal(section.blocks.length, 1);
  assert.equal(section.blocks[0].kind, "heading");
  assert.equal(section.blocks[0].text.text, "Heading");
  assert.equal(section.blocks[0].id, heading.id);
  assert.equal(JSON.stringify(section).includes("heroImage"), false);
  assert.equal(JSON.stringify(section).includes("tagline"), false);
  assert.equal((existing.props as { text: string }).text, "Keep this title");
  const report = result.value.find((file) => file.path === "src/content/editor/unmapped.json");
  const unmapped = report ? (JSON.parse(String(report.contents)) as Array<{ id: string }>) : [];
  assert.equal(unmapped.some((entry) => entry.id === heading.id), false);
});

test("a preview heading block does not change an existing heading or the hero", () => {
  const site = {
    version: 3,
    pages: [
      {
        id: "page_home",
        route: "/",
        title: "Home",
        locked: false,
        sections: [
          {
            id: "sec_hero",
            type: "preset",
            preset: "hero",
            providerLocked: false,
            hidden: false,
            tagline: "Stay",
            heroImage: { src: "/media/a.png", alt: "Office" },
          },
          {
            id: "sec_flow",
            type: "flow",
            hidden: false,
            blocks: [{ id: "blk_who_h", kind: "heading", hidden: false, text: { text: "An agile ally", marks: [] } }],
          },
        ],
      },
    ],
  } as SiteDraft;
  const next = insertFlowBlock(site, "/", "sec_flow", { id: "blk_added", kind: "heading", hidden: false, text: { text: "Heading", marks: [] } }, "blk_who_h");
  const flow = next.pages[0]?.sections[1];
  const hero = next.pages[0]?.sections[0];
  assert.equal(flow?.type, "flow");
  if (flow?.type !== "flow" || hero?.type !== "preset") return;
  assert.equal(flow.blocks[0]?.text && "text" in flow.blocks[0].text ? flow.blocks[0].text.text : "", "An agile ally");
  assert.equal(flow.blocks[1]?.text && "text" in flow.blocks[1].text ? flow.blocks[1].text.text : "", "Heading");
  assert.equal(hero.tagline, "Stay");
  assert.equal(hero.heroImage?.src, "/media/a.png");
  assert.equal(site.pages[0]?.sections[1]?.type === "flow" ? site.pages[0].sections[1].blocks.length : 0, 1);
});
