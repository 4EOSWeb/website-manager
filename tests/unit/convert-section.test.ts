import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { migrateSection } from "../../adapters/quantum-age/migrate-map.ts";
import { convertSection } from "../../src/platform/migrate/convert-section.ts";

const adapter = { migrateSection };

test("flow, freeform, and preset sections convert, and unknown sections stay raw", () => {
  const flow = convertSection({ id: "hero", type: "flow", hidden: false, blocks: [] }, adapter);
  assert.equal(flow.type, "section");
  assert.equal(flow.layout?.mode, "flow");

  const canvas = convertSection({ id: "zone", type: "freeform", hidden: false, items: [] }, adapter);
  assert.equal(canvas.layout?.mode, "canvas");

  const preset = convertSection({ id: "formula", type: "preset", preset: "formula", providerLocked: false }, adapter);
  assert.equal(preset.type, "custom");
  assert.equal(preset.componentId, "quantum-age.card");

  const insights = convertSection({ id: "insights", type: "preset", preset: "insights" }, adapter);
  assert.equal(insights.componentId, "quantum-age.insights-summary");

  const raw = { id: "extra", type: "audio", label: "Clip" };
  const unknown = convertSection(raw, adapter);
  assert.equal(unknown.type, "custom");
  assert.equal(unknown.source.providerManaged, true);
  assert.deepEqual(unknown.metadata.unmapped, raw);

  const platform = fs.readFileSync("src/platform/migrate/convert-section.ts", "utf8");
  assert.equal(platform.includes("formula"), false);
  assert.equal(platform.includes("insights"), false);
  const map = fs.readFileSync("adapters/quantum-age/migrate-map.ts", "utf8");
  assert.match(map, /formula/);
  assert.match(map, /insights/);
});
