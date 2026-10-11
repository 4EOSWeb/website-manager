import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/website_manager";

test("backing up a draft copies the payload and leaves the source row alone", async () => {
  const { prisma } = await import("../../src/lib/prisma.ts");
  const { backupDraft } = await import("../../src/platform/migrate/backup.ts");
  const draftId = "draft_0ddb6f7c7f7a";
  const before = await prisma.workspaceDraft.findUnique({ where: { id: draftId } });
  assert.ok(before);
  const first = await backupDraft(draftId);
  const second = await backupDraft(draftId);
  assert.equal(second, first);
  const after = await prisma.workspaceDraft.findUnique({ where: { id: draftId } });
  const backup = await prisma.draftBackup.findUnique({ where: { id: first } });
  assert.deepEqual(after?.draftData, before.draftData);
  assert.equal(after?.updatedAt.getTime(), before.updatedAt.getTime());
  assert.deepEqual(backup?.payload, before.draftData);
  assert.equal(backup?.sourceDraftId, draftId);
  await prisma.draftBackup.delete({ where: { id: first } });
});
