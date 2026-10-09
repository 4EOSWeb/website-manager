import { test } from "node:test";
import assert from "node:assert/strict";
import { nodeSchema } from "../../src/platform/document/node.ts";

export const minimalNode = {
  id: "node_example",
  type: "text",
  componentId: "text",
  props: {},
  styles: {},
  responsive: {},
  children: [],
  visibility: {},
  locked: false,
  metadata: {},
};

test("a node missing an id fails and a minimal node parses", () => {
  const { id: _id, ...rest } = minimalNode;
  assert.equal(nodeSchema.safeParse(rest).success, false);
  assert.equal(nodeSchema.safeParse(minimalNode).success, true);
});
