import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { siteDraftSchema } from "../../src/lib/content-schema.ts";
import { validateDocument } from "../../src/platform/document/document.ts";
import { minimalNode } from "./document-fixtures.ts";

const page = {
  id: "page_0123456789ab",
  route: "/notes",
  title: "Notes",
  metadata: {},
  root: minimalNode,
};

test("version 1 accepts one page and rejects a bad version, an empty page list, and a repeated id", () => {
  const valid = validateDocument({ version: 1, pages: [page], themeOverrides: { accent: "#112233" } });
  assert.equal(valid.ok, true);
  assert.equal(validateDocument({ version: 2, pages: [page] }).ok, false);
  assert.equal(validateDocument({ version: 1, pages: [] }).ok, false);
  assert.equal(validateDocument({ version: 1, pages: [page, { ...page }] }).ok, false);
  const source = readFileSync(new URL("../../src/platform/document/document.ts", import.meta.url), "utf8");
  assert.equal(/quantum|insights|\/about|\/contact|plum|heroimage|brand-mark/i.test(source), false);

  const snapshot = JSON.parse(readFileSync(new URL("../e2e/.auth/drafts.json", import.meta.url), "utf8")) as {
    drafts: Array<{ id: string; draft_data: unknown }>;
  };
  const current = snapshot.drafts.find((item) => item.id === "draft_0ddb6f7c7f7a");
  const draft = typeof current?.draft_data === "string" ? JSON.parse(current.draft_data) : current?.draft_data;
  assert.equal(siteDraftSchema.safeParse(draft).success, true);
});
