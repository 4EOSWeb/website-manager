import { Prisma, type PrismaClient } from "@/generated/prisma/client";

type DraftDb = Pick<Prisma.TransactionClient, "workspaceDraft" | "draftBackup">;

/** Copies one backup back onto its draft. The backup row stays. */
export async function restoreDraftBackup(backupId: string, db: DraftDb | PrismaClient) {
  const backup = await db.draftBackup.findUnique({ where: { id: backupId } });
  if (!backup) throw new Error("That backup was not found.");
  await db.workspaceDraft.update({
    where: { id: backup.sourceDraftId },
    data: {
      draftData: backup.payload as Prisma.InputJsonValue,
      visualDocument: Prisma.DbNull,
    },
  });
  return backup.sourceDraftId;
}
