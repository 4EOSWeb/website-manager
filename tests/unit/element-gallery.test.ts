import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGallery, writeGallery } from "../../src/platform/elements/gallery.ts";
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

function readProps(value: unknown) {
  if (!value || typeof value !== "object" || !("props" in value)) return {};
  const props = (value as { props?: unknown }).props;
  return props && typeof props === "object" ? props as Record<string, unknown> : {};
}

const heroProps = {
  tagline: "Elevate strategy. Accelerate growth.",
  positioning: "A positioning line.",
  primaryButton: { label: "Talk with us", href: "/talk" },
  heroImage: { src: "/media/hero.png", alt: "Office", placement: "with-copy", align: "start", width: "medium", aspect: "auto", focal: "center" },
};

test("a gallery starts empty and a picked image stays on that node", () => {
  const gallery = createGallery();
  assert.equal(nodeSchema.safeParse(gallery).success, true);
  assert.equal(gallery.type, "gallery");
  assert.deepEqual(gallery.props, { images: [], layout: "grid" });
  const hero = node("node_a10000000001", "custom", { componentId: "quantum-age.hero", props: heroProps });
  const other = node("node_a10000000005", "image", { componentId: "generic.image", props: { src: "/media/other.png", alt: "Other" } });
  const root = node("node_a10000000002", "section", { children: [hero, other, gallery] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const empty = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(empty.ok, true);
  if (!empty.ok) return;
  const emptySite = JSON.parse(String(empty.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const emptyGallery = emptySite.pages[0].sections.find((entry: { type: string }) => entry.type === "gallery");
  assert.deepEqual(emptyGallery.images, []);
  assert.equal(emptyGallery.layoutName, "grid");
  const next = writeGallery(document, gallery.id, "/media/photo.png", "A photo") as typeof document;
  assert.deepEqual(readProps(next.pages[0]?.root.children[2]).images, [{ src: "/media/photo.png", alt: "A photo" }]);
  assert.deepEqual(readProps(next.pages[0]?.root.children[1]), { src: "/media/other.png", alt: "Other" });
  assert.equal((readProps(next.pages[0]?.root.children[0]).heroImage as { src: string }).src, "/media/hero.png");
  assert.deepEqual(readProps(document.pages[0]?.root.children[2]).images, []);
  const result = serializeQuantumAge(next, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const home = JSON.parse(String(result.value.find((file) => file.path === "src/content/pages/home.json")?.contents));
  const section = site.pages[0].sections.find((entry: { type: string }) => entry.type === "gallery");
  assert.deepEqual(section.images, [{ src: "/media/photo.png", alt: "A photo" }]);
  const blocks = site.pages[0].sections.find((entry: { type: string }) => entry.type === "flow").blocks;
  assert.equal(blocks.some((block: { src?: string }) => block.src === "/media/photo.png"), false);
  assert.equal(blocks.some((block: { src?: string }) => block.src === "/media/other.png"), true);
  assert.equal(home.heroImage.src, "/media/hero.png");
  const source = readFileSync(new URL("../../src/platform/elements/gallery.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});
