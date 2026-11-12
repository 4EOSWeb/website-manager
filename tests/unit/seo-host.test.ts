import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { quantumAgeMetadata } from "../../adapters/quantum-age/metadata.ts";
import { pageCapabilityFlags, showMetadata } from "../../src/components/editor/inspector/page-controls.ts";
import { seoHost } from "../../src/platform/pages/seo-host.ts";

test("the search preview host comes from the adapter", () => {
  assert.equal(seoHost({ site: { productionUrl: "https://example.com/docs" } }), "example.com");
  assert.equal(seoHost({ site: quantumAgeMetadata }), new URL(quantumAgeMetadata.productionUrl).host);
  assert.equal(seoHost(null), "");
  assert.equal(showMetadata(pageCapabilityFlags({ level: 2, pageCapabilities: { editMetadata: false } }, {})), false);
  const source = readFileSync("src/components/editor/inspector/page.tsx", "utf8");
  const helper = readFileSync("src/platform/pages/seo-host.ts", "utf8").toLowerCase();
  assert.equal(source.includes("testsite.4eos.com"), false);
  assert.equal(source.includes("seoHost"), true);
  assert.equal(helper.includes("quantum"), false);
  assert.equal(helper.includes("testsite"), false);
});
