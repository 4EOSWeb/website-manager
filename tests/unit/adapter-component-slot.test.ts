import { test } from "node:test";
import assert from "node:assert/strict";
import { componentsSchema } from "../../src/platform/adapter/components.ts";

const text = {
  id: "site.primary-button",
  name: "Button",
  category: "action",
  thumbnail: "none",
  defaultProps: {},
  propsSchemaId: "button",
  inspector: "button",
  acceptsChildren: false,
  allowedParents: ["section"],
  capabilities: {},
  locking: { locked: false },
  renderer: { exportName: "Button" },
};

test("component ids are lowercase and an empty list is valid", () => {
  assert.equal(componentsSchema.safeParse({ components: [text] }).success, true);
  assert.equal(componentsSchema.safeParse({ components: [{ ...text, id: "Hero" }] }).success, false);
  assert.equal(componentsSchema.safeParse({ components: [] }).success, true);
});
