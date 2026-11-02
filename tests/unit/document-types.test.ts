import { test } from "node:test";
import assert from "node:assert/strict";
import { DOCUMENT_VERSION, type NodeType, type PageDocumentV1 } from "../../src/platform/document/types.ts";

const kinds: NodeType[] = [
  "container",
  "text",
  "image",
  "button",
  "link",
  "list",
  "divider",
  "spacer",
  "form",
  "embed",
  "custom",
  "slot",
];

test("the visual document version is 1 and node kinds include container and custom", () => {
  assert.equal(DOCUMENT_VERSION, 1);
  assert.ok(kinds.includes("container"));
  assert.ok(kinds.includes("text"));
  assert.ok(kinds.includes("image"));
  assert.ok(kinds.includes("button"));
  assert.ok(kinds.includes("custom"));
  const page: PageDocumentV1 = {
    version: DOCUMENT_VERSION,
    id: "page_example",
    route: "/example",
    name: "Example",
    nodes: {},
    rootId: "node_root",
  };
  assert.equal(page.rootId, "node_root");
});
