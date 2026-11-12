import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createLink, writeLinkHref } from "../../src/platform/elements/link.ts";
import { insertAfter } from "../../src/platform/elements/create.ts";
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

test("a link node has its own label and a valid address", () => {
  const created = createLink();
  assert.ok(created);
  assert.equal(nodeSchema.safeParse(created).success, true);
  assert.equal(created.type, "link");
  assert.equal(created.componentId, "generic.link");
  assert.deepEqual(created.props, { label: "Link", href: "/" });
  assert.equal("buttonLabel" in created.props, false);
  assert.equal(createLink("http://example.com"), null);
  assert.equal(createLink("javascript:alert(1)"), null);
  assert.equal(createLink("not a link"), null);
  const contact = createLink("/contact");
  assert.ok(contact);
  assert.equal(contact.props.href, "/contact");
  assert.equal(contact.props.label, "Link");

  const source = readFileSync(new URL("../../src/platform/elements/link.ts", import.meta.url), "utf8");
  const lowered = source.toLowerCase();
  for (const word of ["quantum", "heroimage", "tagline", "plum", "insights", "brand-mark"]) {
    assert.equal(lowered.includes(word), false, word);
  }
  assert.match(source, /validLink/);
  const catalog = readFileSync(new URL("../../src/components/editor/library.tsx", import.meta.url), "utf8");
  assert.match(catalog, /createLink\(\)/);
  assert.match(catalog, /id: "element:link"/);
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  assert.match(shell, /insertCreatedLink/);
});

test("an invalid address is not written and the link is not the header button", () => {
  const created = createLink("/about");
  assert.ok(created);
  const hero = node("node_a10000000001", "custom", { componentId: "quantum-age.hero", props: heroProps });
  const root = node("node_a10000000002", "section", { children: [hero, created] });
  const document = { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root }] };
  const rejected = writeLinkHref(document, created.id, "javascript:alert(1)");
  assert.equal(rejected, null);
  assert.equal(readProps(document.pages[0]?.root.children[1]).href, "/about");
  const next = writeLinkHref(document, created.id, "/contact") as typeof document;
  assert.equal(readProps(next.pages[0]?.root.children[1]).href, "/contact");
  assert.equal(readProps(next.pages[0]?.root.children[1]).label, "Link");
  assert.deepEqual(readProps(next.pages[0]?.root.children[0]).primaryButton, heroProps.primaryButton);
  assert.equal(readProps(document.pages[0]?.root.children[1]).href, "/about");

  const placed = insertAfter(
    { version: 1, pages: [{ id: "page_aaaaaaaaaaaa", route: "/", title: "Home", metadata: {}, root: node("node_a10000000002", "section", { children: [hero] }) }] },
    "/",
    hero.id,
    created,
  ) as typeof document;
  assert.equal(placed.pages[0]?.root.children.length, 2);
  assert.equal(createLink("ftp://files.example.com"), null);

  const result = serializeQuantumAge(document, fakeContext("web_quantum_age"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const site = JSON.parse(String(result.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  const home = JSON.parse(String(result.value.find((file) => file.path === "src/content/pages/home.json")?.contents));
  const blocks = site.pages[0].sections[0].blocks;
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].kind, "link");
  assert.equal(blocks[0].text.text, "Link");
  assert.equal(blocks[0].href, "/about");
  assert.equal(site.chrome.header.buttonLabel, "Start a conversation");
  assert.equal(site.chrome.header.buttonHref, "/contact");
  assert.deepEqual(home.primaryButton, { label: "Talk with us", href: "/talk" });

  const broken = node("node_a10000000003", "link", { componentId: "generic.link", props: { label: "Link", href: "javascript:alert(1)" } });
  const brokenRoot = node("node_a10000000004", "section", { children: [hero, broken] });
  const brokenDoc = { version: 1, pages: [{ id: "page_bbbbbbbbbbbb", route: "/", title: "Home", metadata: {}, root: brokenRoot }] };
  const skipped = serializeQuantumAge(brokenDoc, fakeContext("web_quantum_age"));
  assert.equal(skipped.ok, true);
  if (!skipped.ok) return;
  const skippedSite = JSON.parse(String(skipped.value.find((file) => file.path === "src/content/editor/site.json")?.contents));
  assert.equal(skippedSite.pages[0].sections.length, 0);
  assert.equal(skippedSite.chrome.header.buttonHref, "/contact");
});
