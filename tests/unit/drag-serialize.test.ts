import { test } from "node:test";
import assert from "node:assert/strict";
import { projectedBlockIds, serializeQuantumAge } from "../../adapters/quantum-age/serialize.ts";
import { dropSaveData } from "../../src/lib/draft-put.ts";
import { reparent } from "../../src/platform/drag/reparent.ts";
import type { SiteDraft } from "../../src/lib/content-schema.ts";
import { fakeContext } from "./platform-helpers.ts";

const groupId = "node_a10000000002";
const sectionId = "node_a10000000003";
const paragraph = "node_a10000000004";
const heading = "node_a10000000005";

function node(id: string, type: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type,
    componentId: type,
    props: {},
    styles: {},
    responsive: {},
    children: [] as Array<Record<string, unknown>>,
    visibility: { hidden: false, hideOn: [] as string[] },
    locked: { locked: false },
    metadata: {},
    ...extra,
  };
}

function document() {
  const moved = node(paragraph, "text", { componentId: "generic.text", props: { text: "Paragraph" } });
  const stays = node(heading, "text", { componentId: "generic.text", props: { text: "Stays" } });
  const group = node(groupId, "group", { componentId: "generic.group", children: [moved, stays] });
  const section = node(sectionId, "section", { componentId: "generic.section", children: [] });
  const root = node("node_a10000000001", "page", { children: [group, section] });
  return {
    version: 1,
    pages: [{ id: "page_a10000000001", route: "/", title: "Home", metadata: {}, root }],
  };
}

test("a saved drop keeps the version 3 draft and projects the node once", () => {
  const source = document();
  const moved = reparent(source, {
    nodeId: paragraph,
    parentId: sectionId,
    draggedLocked: false,
    childType: "text",
    childParents: { allowedParents: ["section", "container", "stack", "grid", "group", "card"] },
    parentType: "section",
    parentChildren: { acceptsChildren: true },
  });
  assert.ok(moved && moved.ok);
  if (!moved || !moved.ok) return;
  const result = serializeQuantumAge(moved.document, fakeContext("web_example"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const ids = projectedBlockIds(result.value);
  assert.equal(ids.filter((id) => id === paragraph).length, 1);
  assert.equal(ids.filter((id) => id === heading).length, 1);
  const site = { pages: [{ sections: [{ blocks: [{ id: paragraph }] }] }] } as unknown as SiteDraft;
  const saved = dropSaveData(site, moved.document);
  assert.equal(saved.draftData, site);
  assert.equal(saved.visualDocument, moved.document);
  const version3 = dropSaveData(site, undefined);
  assert.equal(version3.visualDocument, undefined);
  assert.equal(JSON.stringify(version3.draftData).split(paragraph).length - 1, 1);
});
