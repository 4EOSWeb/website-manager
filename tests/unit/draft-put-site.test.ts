import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readDraftPut } from "../../src/lib/draft-put.ts";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/website_manager";
import { redactedDraftV3 } from "./fixtures/redacted-draft-v3.ts";
import { minimalNode } from "./document-fixtures.ts";

const visual = {
  version: 1,
  pages: [{ id: "page_0123456789ab", route: "/notes", title: "Notes", metadata: {}, root: minimalNode }],
};

test("a mismatched website id is rejected and a version 3 body leaves the visual document out", () => {
  const mismatch = readDraftPut("web_quantum_age", { websiteId: "web_other", draft: redactedDraftV3, visualDocument: visual });
  assert.equal(mismatch.ok, false);
  if (!mismatch.ok) assert.equal(mismatch.status, 400);

  const version3 = readDraftPut("web_quantum_age", redactedDraftV3);
  assert.equal(version3.ok, true);
  if (version3.ok) assert.equal("visualDocument" in version3, false);

  const omitted = readDraftPut("web_quantum_age", { websiteId: "web_quantum_age", draft: redactedDraftV3, visualDocument: null });
  assert.equal(omitted.ok, true);
  if (omitted.ok) assert.equal("visualDocument" in omitted, false);

  const both = readDraftPut("web_quantum_age", { websiteId: "web_quantum_age", draft: redactedDraftV3, visualDocument: visual });
  assert.equal(both.ok, true);
  if (both.ok) assert.equal((both.visualDocument as { version: number }).version, 1);

  const broken = readDraftPut("web_quantum_age", { websiteId: "web_quantum_age", draft: redactedDraftV3, visualDocument: { version: 1, pages: [] } });
  assert.equal(broken.ok, false);
  if (!broken.ok) assert.equal(broken.message.includes("\n    at "), false);
});

test("a version 3 save does not clear the stored visual document", async () => {
  const { Prisma } = await import("../../src/generated/prisma/client.ts");
  const { prisma } = await import("../../src/lib/prisma.ts");
  class Rollback extends Error {}
  const row = await prisma.workspaceDraft.findUnique({ where: { id: "draft_0ddb6f7c7f7a" } });
  assert.ok(row?.visualDocument);
  const before = JSON.stringify(row.visualDocument);
  try {
    await prisma.$transaction(async (tx) => {
      const version3 = readDraftPut("web_quantum_age", row.draftData);
      assert.equal(version3.ok, true);
      if (!version3.ok) return;
      await tx.workspaceDraft.update({
        where: { id: row.id },
        data: version3.visualDocument === undefined ? { draftData: version3.site as Prisma.InputJsonValue } : { draftData: version3.site as Prisma.InputJsonValue, visualDocument: version3.visualDocument as Prisma.InputJsonValue },
      });
      const kept = await tx.workspaceDraft.findUnique({ where: { id: row.id } });
      assert.equal(JSON.stringify(kept?.visualDocument), before);
      const both = readDraftPut("web_quantum_age", { websiteId: "web_quantum_age", draft: row.draftData, visualDocument: row.visualDocument });
      assert.equal(both.ok, true);
      if (!both.ok || both.visualDocument === undefined) return;
      await tx.workspaceDraft.update({
        where: { id: row.id },
        data: { draftData: both.site as Prisma.InputJsonValue, visualDocument: both.visualDocument as Prisma.InputJsonValue },
      });
      const written = await tx.workspaceDraft.findUnique({ where: { id: row.id } });
      assert.equal((written?.visualDocument as { version?: number } | null)?.version, 1);
      throw new Rollback();
    });
    assert.fail("the transaction should roll back");
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
  const after = await prisma.workspaceDraft.findUnique({ where: { id: "draft_0ddb6f7c7f7a" } });
  assert.equal(JSON.stringify(after?.visualDocument), before);
});

test("a failed save does not replace the in-memory documents, and address changes still use the page id", () => {
  const shell = readFileSync(new URL("../../src/components/editor-shell.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../../src/app/api/sites/[websiteId]/draft/route.ts", import.meta.url), "utf8");
  const persist = shell.slice(shell.indexOf("const persistSite"), shell.indexOf("useEffect(() => {\n    if (dirtyWebsite"));
  assert.equal(persist.includes("websiteId: props.websiteId"), true);
  assert.equal(persist.includes("draft: next"), true);
  assert.equal(persist.includes("visualDocument"), true);
  assert.equal(persist.includes("setSite("), false);
  assert.equal(persist.includes("visualDocument = null"), false);
  assert.equal(route.includes("where: { id: page.id }"), true);
  assert.equal(route.includes("route: page.route, title: page.title"), true);
  assert.match(route, /\{ draftData: site \}/);
});
