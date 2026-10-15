import { test } from "node:test";
import assert from "node:assert/strict";
import { quantumAgeFooterLock, quantumAgeHeaderLock, quantumAgeLogoLock } from "../../adapters/quantum-age/locking.ts";
import { applyLayerUnlock, genericParagraphLock, layerRole, policyForLayer } from "../../src/components/editor/layers/unlock-policy.ts";
import { canUnlock } from "../../src/platform/registry/locking.ts";
import type { SiteDraft } from "../../src/lib/content-schema.ts";

function site(): SiteDraft {
  return {
    pages: [{
      route: "/",
      sections: [{
        id: "hero",
        type: "flow",
        blocks: [
          { id: "blk_rings", kind: "brand-mark", hidden: false, locked: true, text: { text: "Rings", marks: [] } },
          { id: "blk_p", kind: "paragraph", hidden: false, locked: true, text: { text: "Keep this", marks: [] } },
        ],
      }],
    }],
  } as unknown as SiteDraft;
}

function locked(value: SiteDraft, id: string): boolean | undefined {
  const section = value.pages[0]?.sections[0];
  const block = section?.type === "flow" ? section.blocks.find((item) => item.id === id) : undefined;
  return block?.locked;
}

test("an editor cannot unlock the logo, header, or footer", () => {
  assert.deepEqual([...policyForLayer("brand-mark").unlockRoles], [...quantumAgeLogoLock.unlockRoles]);
  assert.deepEqual([...policyForLayer("header").unlockRoles], [...quantumAgeHeaderLock.unlockRoles]);
  assert.deepEqual([...policyForLayer("footer").unlockRoles], [...quantumAgeFooterLock.unlockRoles]);
  assert.equal(canUnlock(quantumAgeLogoLock, "editor"), false);
  assert.equal(canUnlock(policyForLayer("brand-mark"), "editor"), false);
  assert.equal(canUnlock(quantumAgeHeaderLock, "editor"), false);
  assert.equal(canUnlock(quantumAgeFooterLock, "editor"), false);
  assert.equal(canUnlock(quantumAgeLogoLock, "administrator"), true);
  const before = site();
  const refused = applyLayerUnlock(before, "/", "hero", "blk_rings", "brand-mark", "editor", null);
  assert.equal(refused.ok, false);
  if (refused.ok) return;
  assert.equal(refused.reason, "Only an administrator can unlock this.");
  assert.equal(locked(before, "blk_rings"), true);
});

test("an administrator can unlock the logo and an editor can unlock a paragraph", () => {
  assert.equal(layerRole("4EOS administrator"), "administrator");
  assert.equal(layerRole("Editor"), "editor");
  assert.equal(canUnlock(policyForLayer("brand-mark"), layerRole("4EOS administrator")), true);
  assert.equal(canUnlock(genericParagraphLock, "editor"), true);
  const logo = applyLayerUnlock(site(), "/", "hero", "blk_rings", "brand-mark", "administrator", {
    version: 1,
    pages: [{ route: "/", root: { id: "root", children: [{ id: "blk_rings", type: "custom", locked: { locked: true }, children: [] }] } }],
  });
  assert.equal(logo.ok, true);
  if (!logo.ok) return;
  assert.equal(locked(logo.site, "blk_rings"), false);
  const visual = logo.visual as { pages: { root: { children: { locked?: { locked?: boolean } }[] } }[] };
  assert.equal(visual.pages[0]?.root.children[0]?.locked?.locked, false);
  const paragraph = applyLayerUnlock(site(), "/", "hero", "blk_p", "paragraph", "editor", null);
  assert.equal(paragraph.ok, true);
  if (!paragraph.ok) return;
  assert.equal(locked(paragraph.site, "blk_p"), false);
  const block = paragraph.site.pages[0]?.sections[0];
  const text = block?.type === "flow" ? block.blocks.find((item) => item.id === "blk_p") : undefined;
  assert.equal(text && "text" in text ? text.text?.text : "", "Keep this");
  assert.equal(locked(site(), "blk_rings"), true);
});
