import { test } from "node:test";
import assert from "node:assert/strict";
import { harborVisitTemplate } from "../../fixtures/harbor/templates.ts";
import { serializeHarbor } from "../../fixtures/harbor/serialize.ts";
import { validateDocument } from "../../src/platform/document/document.ts";

const context = {
  clientId: "client_harbor",
  websiteId: "web_harbor",
  repository: "harbor/harbor-site",
  branch: "main",
  actorId: "user_harbor",
};

test("harbor documents serialize inside the harbor workspace", () => {
  const written = serializeHarbor(harborVisitTemplate.document, context);
  assert.equal(written.ok, true);
  if (!written.ok) return;
  assert.equal(written.value.length, 1);
  assert.equal(written.value[0]?.path, "src/content/editor/document.json");
  assert.equal(written.value.some((file) => file.path.includes("insights") || file.path.endsWith("home.json")), false);
  const again = validateDocument(JSON.parse(written.value[0]?.contents ?? ""));
  assert.equal(again.ok, true);
});
