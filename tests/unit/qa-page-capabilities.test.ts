import { test } from "node:test";
import assert from "node:assert/strict";
import { resolvePageCapabilities } from "../../src/platform/adapter/page-capabilities.ts";
import { quantumAgeRouteCapabilities } from "../../adapters/quantum-age/page-capabilities.ts";

test("privacy and terms stay provider-managed and articles are not blanket-locked", () => {
  for (const route of ["/", "/solutions", "/about", "/contact"] as const) {
    const flags = resolvePageCapabilities(2, quantumAgeRouteCapabilities[route]);
    assert.equal(flags.ok, true);
    if (flags.ok) {
      assert.equal(flags.value.editBody, true);
      assert.equal(flags.value.editMetadata, true);
      assert.equal(flags.value.lockLayout, false);
      assert.equal(flags.value.providerManaged, false);
    }
  }
  for (const route of ["/privacy", "/terms"] as const) {
    const flags = resolvePageCapabilities(2, quantumAgeRouteCapabilities[route]);
    assert.equal(flags.ok, true);
    if (flags.ok) {
      assert.equal(flags.value.providerManaged, true);
      assert.equal(flags.value.editBody, false);
      assert.equal(flags.value.editMetadata, true);
    }
  }
  const article = resolvePageCapabilities(2, quantumAgeRouteCapabilities["/insights/:slug"]);
  assert.equal(article.ok, true);
  if (article.ok) {
    assert.equal(article.value.editMetadata, true);
    assert.equal(article.value.lockContent, false);
    assert.equal(article.value.providerManaged, false);
    assert.equal(article.value.editHeader, true);
  }
});
