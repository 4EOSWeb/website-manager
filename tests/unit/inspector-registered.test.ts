import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { fieldsForRegistered, inspectorSlot } from "../../src/components/editor/inspector/registered-model.ts";
import { registeredInspectorPlan } from "../../src/lib/editor-adapter.ts";

test("registered components render their own fields and an unknown slot warns an administrator", () => {
  const sample = fieldsForRegistered(
    [{ id: "sample.card", customInspectorId: "sample.card.panel" }],
    { "sample.card": z.object({ title: z.string() }) },
  );
  assert.equal(sample[0]?.fields[0]?.prop, "title");
  assert.equal(sample[0]?.fields[0]?.control, "text");
  assert.equal(sample[0]?.fields[0]?.supplement, true);
  assert.equal(inspectorSlot("sample.card.panel", { "sample.card.panel": { label: "Extra" } }, "basic").status, "ready");
  assert.equal(inspectorSlot("missing.panel", {}, "administrator").warning, "This custom inspector is not available.");
  assert.equal(inspectorSlot("missing.panel", {}, "basic").status, "hidden");
  const plan = registeredInspectorPlan({
    components: {
      components: [
        { id: "quantum-age.insights-summary" },
        { id: "quantum-age.hero", customInspectorId: "site.hero.panel" },
      ],
    },
  });
  const summary = plan.registered.find((item) => item.componentId === "quantum-age.insights-summary");
  const hero = plan.registered.find((item) => item.componentId === "quantum-age.hero");
  assert.equal(summary?.fields.some((field) => field.prop === "heading"), true);
  assert.equal(hero?.fields.some((field) => field.prop === "tagline"), true);
  assert.equal(hero?.customInspectorId, "site.hero.panel");
  assert.equal(plan.slots["site.hero.panel"], undefined);
  const generated = readFileSync("src/components/editor/inspector/generated.tsx", "utf8");
  const model = readFileSync("src/components/editor/inspector/registered-model.ts", "utf8");
  assert.equal(generated.includes("hero-content-image"), false);
  assert.equal(model.includes("hero-content-image"), false);
  assert.equal(generated.includes("adapters/quantum-age"), false);
  assert.equal(model.includes("adapters/quantum-age"), false);
  assert.equal(readFileSync("src/components/editor-shell.tsx", "utf8").includes("data-button-fields"), false);
  assert.equal(readFileSync("src/components/editor/inspector/button-fields.tsx", "utf8").includes("data-button-fields"), true);
});
