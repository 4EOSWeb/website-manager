import assert from "node:assert/strict";
import { test } from "node:test";
import { breakpointWidth } from "../../adapters/quantum-age/migrate-map.ts";
import { convertFreeform } from "../../src/platform/migrate/convert-freeform.ts";

const adapter = { breakpointWidth };

test("freeform items keep ids, tablet boxes, and reflow when mobile is missing", () => {
  const converted = convertFreeform({
    items: [
      { id: "item_a", kind: "text", hidden: false, locked: false, desktop: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 }, tablet: { x: 10, y: 20, w: 30, h: 40 } },
      { id: "item_b", kind: "heading", hidden: false, locked: false, desktop: { x: 1280, y: 0, w: 640, h: 100 }, groupId: "grp_aaaaaaaaaaaa" },
      { id: "item_c", kind: "image", hidden: false, locked: false, groupId: "grp_aaaaaaaaaaaa", desktop: { x: "bad" } },
    ],
  }, adapter);
  const lone = converted.children.find((item) => item.id === "item_a");
  assert.ok(lone);
  assert.deepEqual(lone.box, { x: 10, y: 20, w: 30, h: 40 });
  assert.deepEqual(lone.responsive.tablet?.box, { x: 10, y: 20, w: 30, h: 40 });
  assert.equal(lone.responsive.mobile, undefined);
  assert.equal(lone.responsive.strategy, "custom");

  const group = converted.children.find((item) => item.id === "grp_aaaaaaaaaaaa");
  assert.equal(group?.type, "group");
  assert.deepEqual(group?.children.map((item) => item.id), ["item_b", "item_c"]);
  const pixels = group?.children.find((item) => item.id === "item_b");
  assert.equal(pixels?.responsive.strategy, "reflow");
  assert.equal(pixels?.responsive.mobile, undefined);
  assert.equal(pixels?.box?.x, 100);
  assert.equal(pixels?.box?.w, 50);
  const failed = group?.children.find((item) => item.id === "item_c");
  assert.ok(failed?.metadata.unmapped);
  assert.equal(converted.warnings.some((warning) => warning.id === "item_c"), true);
});
