import { test } from "node:test";
import assert from "node:assert/strict";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { assertUniqueIds } from "../../src/platform/document/tree.ts";
import { minimalNode } from "./document-fixtures.ts";

function node(id: string, children: unknown[] = []) {
  return { ...minimalNode, id, children };
}

test("nested nodes parse, duplicate ids fail, and depth 13 fails", () => {
  const nested = node("node_aaaaaaaaaaaa", [node("node_bbbbbbbbbbbb")]);
  const parsed = nodeSchema.safeParse(nested);
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(assertUniqueIds(parsed.data).ok, true);

  const duplicate = nodeSchema.safeParse(node("node_aaaaaaaaaaaa", [node("node_aaaaaaaaaaaa")]));
  assert.equal(duplicate.success, true);
  if (duplicate.success) {
    const checked = assertUniqueIds(duplicate.data);
    assert.equal(checked.ok, false);
    if (!checked.ok) assert.equal(checked.error.code, "document_invalid");
  }

  let deep: ReturnType<typeof node> = node("node_00000000000d");
  for (let level = 12; level >= 1; level -= 1) deep = node(`node_${level.toString(16).padStart(12, "0")}`, [deep]);
  assert.equal(nodeSchema.safeParse(deep).success, false);
});
