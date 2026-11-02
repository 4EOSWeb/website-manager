import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { serializeQuantumAge } from "../../adapters/quantum-age/serialize.ts";
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
    src: "",
    alt: "",
    placement: "with-copy",
    align: "start",
    width: "medium",
    aspect: "auto",
    focal: "center",
  },
};

test("a hero component serializes to home json and an unknown node is reported", () => {
  const publish = readFileSync(new URL("../../src/lib/publish.ts", import.meta.url), "utf8");
  assert.equal(publish.includes("serializeQuantumAge"), false);
  assert.equal(publish.includes("adapters/quantum-age/serialize"), false);
  const hero = node("node_a10000000002", "custom", { componentId: "quantum-age.hero", props: heroProps });
  const unknown = node("node_a10000000003", "custom", { componentId: "unknown.widget" });
  const root = node("node_a10000000001", "section", {
    layout: { mode: "flow", direction: "vertical", gap: 16 },
    children: [hero, unknown],
  });
  const result = serializeQuantumAge(
    {
      version: 1,
      pages: [{ id: "page_a10000000001", route: "/", title: "Home", metadata: {}, root }],
    },
    fakeContext("web_quantum_age"),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const home = result.value.find((file) => file.path === "src/content/pages/home.json");
  const site = result.value.find((file) => file.path === "src/content/editor/site.json");
  const report = result.value.find((file) => file.path === "src/content/editor/unmapped.json");
  assert.ok(home);
  assert.ok(site);
  assert.deepEqual(JSON.parse(String(home?.contents)), heroProps);
  assert.equal(JSON.parse(String(site?.contents)).version, 3);
  const unmapped = JSON.parse(String(report?.contents)) as Array<{ id: string }>;
  assert.equal(unmapped.some((entry) => entry.id === "node_a10000000003"), true);
  assert.equal(unmapped.some((entry) => entry.id === "node_a10000000002"), false);
});
