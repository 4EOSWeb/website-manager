import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createVideo, writeVideoUrl } from "../../src/platform/elements/video.ts";
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

const youtube = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

test("an http video address is rejected and an https address is kept", () => {
  assert.equal(createVideo("http://www.youtube.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(createVideo("https://example.com/watch"), null);
  const empty = createVideo();
  assert.ok(empty);
  assert.equal(nodeSchema.safeParse(empty).success, true);
  assert.equal(empty.type, "video");
  assert.equal(empty.componentId, "generic.video");
  assert.deepEqual(empty.props, { url: "" });
  const video = createVideo(youtube);
  assert.ok(video);
  assert.equal(readProps(video).url, youtube);
  const source = readFileSync(new URL("../../src/platform/elements/video.ts", import.meta.url), "utf8").toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(source.includes(word), false, word);
  }
});

test("the serializer keeps the video address and the existing image", () => {
  const video = createVideo(youtube);
  assert.ok(video);
  const image = node("node_a10000000005", "image", { componentId: "generic.image", props: { src: "/media/photo.png", alt: "A photo" } });
  const invalid = node("node_a10000000006", "video", { componentId: "generic.video", props: { url: "http://www.youtube.com/watch?v=dQw4w9WgXcQ" } });
  const root = node("node_a10000000002", "section", { children: [image, video, invalid] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const sections = site.pages[0].sections;
  const flow = sections.find((section: { type: string }) => section.type === "flow");
  const videos = sections.filter((section: { type: string }) => section.type === "video");
  assert.equal(flow.blocks.length, 1);
  assert.equal(flow.blocks[0].kind, "image");
  assert.equal(flow.blocks[0].src, "/media/photo.png");
  assert.equal(videos.length, 1);
  assert.equal(videos[0].url, youtube);
  assert.equal(JSON.stringify(site).includes("http://"), false);

  const next = writeVideoUrl(document, video.id, "https://vimeo.com/123456") as typeof document;
  assert.equal(readProps(next.pages[0]?.root.children[1]).url, "https://vimeo.com/123456");
  assert.equal(readProps(next.pages[0]?.root.children[0]).src, "/media/photo.png");
  assert.equal(writeVideoUrl(document, video.id, "http://vimeo.com/123456"), null);
});
