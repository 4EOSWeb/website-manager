import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createImage, writeImage } from "../../src/platform/elements/image.ts";
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

test("an image node starts empty", () => {
  const image = createImage();
  assert.equal(nodeSchema.safeParse(image).success, true);
  assert.equal(image.type, "image");
  assert.equal(image.componentId, "generic.image");
  assert.deepEqual(image.props, { src: "", alt: "" });
  const source = readFileSync(new URL("../../src/platform/elements/image.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});

test("choosing a picture updates this image and leaves the hero source alone", () => {
  const image = createImage();
  const hero = node("node_a10000000001", "custom", { componentId: "quantum-age.hero", props: heroProps });
  const other = node("node_a10000000005", "image", { componentId: "generic.image", props: { src: "/media/other.png", alt: "Other" } });
  const root = node("node_a10000000002", "section", { children: [hero, other, image] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const next = writeImage(document, image.id, "/media/photo.png", "A photo") as typeof document;
  assert.deepEqual(readProps(next.pages[0]?.root.children[2]), { src: "/media/photo.png", alt: "A photo" });
  assert.deepEqual(readProps(next.pages[0]?.root.children[1]), { src: "/media/other.png", alt: "Other" });
  assert.equal((readProps(next.pages[0]?.root.children[0]).heroImage as { src: string }).src, "/media/hero.png");
  assert.equal(readProps(document.pages[0]?.root.children[2]).src, "");

  const result = serializeQuantumAge(next, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const home = JSON.parse(String(result.value.find((file) => file.path === "src/content/pages/home.json")?.contents));
  const blocks = site.pages[0].sections[0].blocks;
  assert.equal(blocks.length, 2);
  assert.equal(blocks[1].kind, "image");
  assert.equal(blocks[1].src, "/media/photo.png");
  assert.equal(blocks[1].alt, "A photo");
  assert.equal(home.heroImage.src, "/media/hero.png");
});
