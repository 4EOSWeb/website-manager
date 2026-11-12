import { Prisma, type PrismaClient } from "@/generated/prisma/client";

type DraftDb = Pick<Prisma.TransactionClient, "workspaceDraft" | "draftBackup">;

/** Copies one backup back onto its draft. The backup row stays. */
export async function restoreDraftBackup(backupId: string, websiteId: string, db: DraftDb | PrismaClient) {
  const backup = await db.draftBackup.findUnique({ where: { id: backupId } });
  if (!backup) throw new Error("That backup was not found.");
  if (backup.websiteId !== websiteId) throw new Error("That backup belongs to a different site.");
  await db.workspaceDraft.update({
    where: { id: backup.sourceDraftId },
    data: {
      draftData: backup.payload as Prisma.InputJsonValue,
      visualDocument: Prisma.DbNull,
    },
  });
  return backup.sourceDraftId;
}

/** Restores the newest backup for each draft on one site. Older backups stay. */
export async function restoreLatestBackups(websiteId: string, db: DraftDb | PrismaClient) {
  const backups = await db.draftBackup.findMany({
    where: { websiteId },
    orderBy: { createdAt: "desc" },
  });
  const seen = new Set<string>();
  const restored: string[] = [];
  for (const backup of backups) {
    if (seen.has(backup.sourceDraftId)) continue;
    seen.add(backup.sourceDraftId);
    await restoreDraftBackup(backup.id, websiteId, db);
    restored.push(backup.sourceDraftId);
  }
  return restored;
}
