import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { breakpointWidth, migrateButton, migrateSection, migrateText } from "../../adapters/quantum-age/migrate-map.ts";
import { validateDocumentHook } from "../../adapters/quantum-age/validate.ts";
import type { SiteContext } from "../../src/platform/context.ts";
import { redactedDraftV3 } from "./fixtures/redacted-draft-v3.ts";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/website_manager";

const context: SiteContext = {
  clientId: "client_example",
  websiteId: "web_quantum_age",
  repository: "example",
  branch: "main",
  actorId: "user_example",
};

const adapter = { migrateText, migrateButton, migrateSection, breakpointWidth };

class Rollback extends Error {}

test("execution stores a visual document beside version 3 and rolls the fixture back", async () => {
  const { Prisma } = await import("../../src/generated/prisma/client.ts");
  const { prisma } = await import("../../src/lib/prisma.ts");
  const { draftChecksum } = await import("../../src/platform/migrate/checksum.ts");
  const { validateDocument } = await import("../../src/platform/document/document.ts");
  const { executeMigration } = await import("../../src/platform/migrate/execute.ts");
  const { parseVersion3 } = await import("../../src/platform/migrate/parse-v3.ts");
  const { restoreDraftBackup } = await import("../../src/platform/migrate/restore.ts");
  const source = readFileSync(new URL("../../src/app/api/sites/[websiteId]/draft/route.ts", import.meta.url), "utf8");
  assert.match(source, /update: \{ draftData: site \}/);
  assert.equal(source.includes("visualDocument:"), false);
  assert.match(source, /visual_document stays until step 19.25/);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.workspaceDraft.create({
        data: {
          id: "draft_exec_ok",
          websiteId: "web_quantum_age",
          userId: "user_admin",
          draftData: redactedDraftV3 as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.workspaceDraft.create({
        data: {
          id: "draft_exec_bad",
          websiteId: "web_quantum_age",
          userId: "user_editor",
          draftData: { hello: true },
        },
      });
      const loaded = await tx.workspaceDraft.findMany({ where: { id: { in: ["draft_exec_ok", "draft_exec_bad"] } }, orderBy: { id: "asc" } });
      const rows = loaded.map((row) => ({ id: row.id, draftData: row.draftData }));
      const dryRun = {
        websiteId: "web_quantum_age",
        drafts: rows.map((row) => ({ id: row.id, ok: row.id === "draft_exec_ok", checksum: draftChecksum(row.draftData) })),
      };
      const result = await executeMigration({ websiteId: "web_quantum_age", dryRun, rows, adapter, hook: validateDocumentHook, context, db: tx });
      assert.equal(result.refused, false);
      assert.equal(result.drafts.find((draft) => draft.id === "draft_exec_ok")?.status, "stored");
      assert.equal(result.drafts.find((draft) => draft.id === "draft_exec_bad")?.status, "unchanged");

      const stored = await tx.workspaceDraft.findUnique({ where: { id: "draft_exec_ok" } });
      const skipped = await tx.workspaceDraft.findUnique({ where: { id: "draft_exec_bad" } });
      assert.equal(parseVersion3(stored?.draftData).ok, true);
      assert.equal(validateDocument(stored?.visualDocument).ok, true);
      assert.equal(skipped?.visualDocument, null);
      assert.deepEqual(skipped?.draftData, { hello: true });

      await tx.workspaceDraft.update({ where: { id: "draft_exec_ok" }, data: { draftData: stored!.draftData as Prisma.InputJsonValue } });
      const saved = await tx.workspaceDraft.findUnique({ where: { id: "draft_exec_ok" } });
      assert.equal((saved?.visualDocument as { version?: number } | null)?.version, 1);

      const mismatch = await executeMigration({
        websiteId: "web_quantum_age",
        dryRun: { websiteId: "web_quantum_age", drafts: rows.map((row) => ({ id: row.id, ok: true, checksum: "different" })) },
        rows,
        adapter,
        hook: validateDocumentHook,
        context,
        db: tx,
      });
      assert.equal(mismatch.refused, true);
      assert.equal((await tx.workspaceDraft.findUnique({ where: { id: "draft_exec_bad" } }))?.visualDocument, null);
      assert.equal((await tx.workspaceDraft.findUnique({ where: { id: "draft_exec_ok" } }))?.visualDocument == null, false);

      const backupId = result.drafts.find((draft) => draft.id === "draft_exec_ok")?.backupId;
      assert.ok(backupId);
      await restoreDraftBackup(backupId, "web_quantum_age", tx);
      const restored = await tx.workspaceDraft.findUnique({ where: { id: "draft_exec_ok" } });
      assert.equal(restored?.visualDocument, null);
      assert.equal(parseVersion3(restored?.draftData).ok, true);
      assert.ok(await tx.draftBackup.findUnique({ where: { id: backupId } }));
      throw new Rollback();
    });
    assert.fail("the fixture transaction should roll back");
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }

  assert.equal(await prisma.workspaceDraft.findUnique({ where: { id: "draft_exec_ok" } }), null);
  assert.equal(await prisma.draftBackup.count({ where: { sourceDraftId: "draft_exec_ok" } }), 0);
});
