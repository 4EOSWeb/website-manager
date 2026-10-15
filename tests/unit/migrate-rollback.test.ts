import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/website_manager";

const exec = promisify(execFile);

class Rollback extends Error {}

test("rollback refuses to run without a website", async () => {
  try {
    await exec(process.execPath, ["--experimental-strip-types", "--no-warnings", "--import", "./tests/unit/resolve-ts.mjs", "scripts/restore-draft-backup.ts"], { cwd: fileURLToPath(new URL("../..", import.meta.url)) });
    assert.fail("rollback should refuse without a website");
  } catch (error) {
    const stderr = String((error as { stderr?: string }).stderr ?? "");
    assert.match(stderr, /Pass --website/);
  }
});

test("rollback restores the newest backup and rejects a different site", async () => {
  const { prisma } = await import("../../src/lib/prisma.ts");
  const { restoreDraftBackup, restoreLatestBackups } = await import("../../src/platform/migrate/restore.ts");
  const draftId = "draft_rollback_fixture";
  try {
    await prisma.$transaction(async (tx) => {
      await tx.workspaceDraft.create({
        data: {
          id: draftId,
          websiteId: "web_quantum_age",
          userId: "user_admin",
          draftData: { marker: "current" },
          visualDocument: { version: 1 },
        },
      });
      await tx.draftBackup.create({
        data: {
          id: "bak_rollback_old",
          websiteId: "web_quantum_age",
          sourceDraftId: draftId,
          versionLabel: "3",
          payload: { marker: "older" },
          createdAt: new Date(Date.now() - 60_000),
        },
      });
      await tx.draftBackup.create({
        data: {
          id: "bak_rollback_new",
          websiteId: "web_quantum_age",
          sourceDraftId: draftId,
          versionLabel: "3",
          payload: { marker: "newer" },
          createdAt: new Date(),
        },
      });
      await tx.draftBackup.create({
        data: {
          id: "bak_rollback_other",
          websiteId: "web_other",
          sourceDraftId: draftId,
          versionLabel: "3",
          payload: { marker: "other" },
        },
      });

      await assert.rejects(restoreDraftBackup("bak_rollback_other", "web_quantum_age", tx), /different site/);
      assert.deepEqual((await tx.workspaceDraft.findUnique({ where: { id: draftId } }))?.draftData, { marker: "current" });
      assert.equal((await tx.workspaceDraft.findUnique({ where: { id: draftId } }))?.visualDocument == null, false);

      const latest = await restoreLatestBackups("web_quantum_age", tx);
      assert.equal(latest.includes(draftId), true);
      const restored = await tx.workspaceDraft.findUnique({ where: { id: draftId } });
      assert.deepEqual(restored?.draftData, { marker: "newer" });
      assert.equal(restored?.visualDocument, null);
      assert.equal(await tx.draftBackup.count({ where: { sourceDraftId: draftId } }), 3);

      await restoreDraftBackup("bak_rollback_old", "web_quantum_age", tx);
      const older = await tx.workspaceDraft.findUnique({ where: { id: draftId } });
      assert.deepEqual(older?.draftData, { marker: "older" });
      assert.equal(older?.visualDocument, null);
      assert.ok(await tx.draftBackup.findUnique({ where: { id: "bak_rollback_old" } }));
      throw new Rollback();
    });
    assert.fail("the fixture transaction should roll back");
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
  assert.equal(await prisma.workspaceDraft.findUnique({ where: { id: draftId } }), null);
  assert.equal(await prisma.draftBackup.count({ where: { id: { in: ["bak_rollback_old", "bak_rollback_new", "bak_rollback_other"] } } }), 0);
  const live = await prisma.workspaceDraft.findMany({ where: { websiteId: "web_quantum_age" }, orderBy: { id: "asc" } });
  assert.deepEqual(live.map((row) => (row.visualDocument as { version?: number } | null)?.version), [1, 1]);
});
