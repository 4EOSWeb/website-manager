import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { componentDefinitionSchema } from "../../src/platform/adapter/components.ts";
import { quantumAgeHero } from "../../adapters/quantum-age/components/hero.ts";
import {
  applySectionLayout,
  confirmLayoutMode,
  definitionAllowsLayout,
  layoutConversionAllowed,
  layoutModeName,
  layoutSettingKeys,
  pendingLayoutMode,
  restorePreviousLayout,
  writeLayoutSetting,
  type LayoutNode,
} from "../../src/components/editor/inspector/layout-model.ts";
import type { SiteDraft } from "../../src/lib/content-schema.ts";

test("confirm stores the previous layout and undo restores the mode and settings", () => {
  const stack: LayoutNode = {
    id: "node_stack",
    componentId: "generic.stack",
    metadata: {},
    props: {},
    layout: { mode: "layout", display: "flex", direction: "column", gap: 16, align: "stretch", justify: "start", wrap: false },
    allowLayoutConversion: true,
  };
  assert.equal(pendingLayoutMode("Stack", "Stack"), null);
  const cancelled = stack;
  assert.equal(layoutModeName(cancelled.layout), "Stack");
  assert.equal(pendingLayoutMode("Stack", "Canvas"), "Canvas");
  const edited = writeLayoutSetting(stack, "gap", 24);
  const confirmed = confirmLayoutMode(edited, "Canvas");
  const confirmedLayout = confirmed.layout;
  assert.ok(confirmedLayout);
  assert.equal(layoutModeName(confirmedLayout), "Canvas");
  assert.equal(layoutModeName(confirmedLayout.previous), "Stack");
  assert.equal(confirmedLayout.previous && "gap" in confirmedLayout.previous ? confirmedLayout.previous.gap : 0, 24);
  assert.equal(confirmedLayout.previous && "direction" in confirmedLayout.previous ? confirmedLayout.previous.direction : "", "column");
  const restored = restorePreviousLayout(confirmed);
  assert.equal(layoutModeName(restored.layout), "Stack");
  assert.equal(restored.layout && "gap" in restored.layout ? restored.layout.gap : 0, 24);
  assert.equal(restored.layout && "direction" in restored.layout ? restored.layout.direction : "", "column");
  assert.deepEqual(layoutSettingKeys("Stack"), ["direction", "gap", "align", "justify", "wrap"]);
  assert.deepEqual(layoutSettingKeys("Grid"), ["columns", "gap", "align"]);
});

test("layout conversion is on for a generic container and off when the flag is false", () => {
  assert.equal(componentDefinitionSchema.safeParse(quantumAgeHero).success, true);
  assert.equal(quantumAgeHero.allowLayoutConversion, false);
  assert.equal(layoutConversionAllowed(quantumAgeHero), false);
  assert.equal(definitionAllowsLayout([quantumAgeHero], quantumAgeHero.id), false);
  assert.equal(definitionAllowsLayout([], "generic.stack"), true);
  assert.equal(definitionAllowsLayout(undefined, "generic.container"), true);
  assert.equal(layoutConversionAllowed({}), true);
  assert.equal(layoutConversionAllowed({ allowLayoutConversion: false }), false);
  const source = [
    "src/components/editor/inspector/layout-fields.tsx",
    "src/components/editor/inspector/layout-model.ts",
    "src/platform/adapter/components.ts",
    "src/platform/registry/types.ts",
  ].map((file) => readFileSync(file, "utf8")).join("\n");
  const lowered = source.toLowerCase();
  assert.equal(lowered.includes("quantum"), false);
  assert.equal(lowered.includes("plum"), false);
  assert.equal(lowered.includes("hero"), false);
  assert.equal(source.includes("if (!props.allowed) return null"), true);
  assert.equal(source.includes("Changing the layout can change how this section behaves on smaller screens."), true);
  const shell = readFileSync("src/components/editor-shell.tsx", "utf8");
  assert.equal(shell.includes("definitionAllowsLayout"), true);
});

test("converting a stack section to canvas keeps the original section until undo", () => {
  const stack = { id: "sec_stack", type: "flow" as const, hidden: false, editorName: "Stack", layout: "stack" as const, blocks: [] };
  const site = { pages: [{ route: "/", sections: [stack] }] } as unknown as SiteDraft;
  const next = applySectionLayout(site, "/", "sec_stack", "Canvas");
  const created = next.pages[0]?.sections[0];
  assert.equal(created?.type, "freeform");
  assert.equal(created && "name" in created ? created.name : "", "Stack");
  assert.equal(site.pages[0]?.sections[0]?.type, "flow");
  assert.equal(site.pages[0]?.sections[0] && "layout" in site.pages[0].sections[0] ? site.pages[0].sections[0].layout : "", "stack");
});
